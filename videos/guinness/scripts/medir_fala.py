import sys, glob, re, subprocess, json
import numpy as np
U=sys.argv[1]
files={}
for f in glob.glob(U+"/*.mp4"):
    m=re.search(r"_-_(\d+)", f); files[int(m.group(1))]=f
out={}
for n in sorted(files):
    f=files[n]
    raw=subprocess.run(["ffmpeg","-v","error","-i",f,"-ac","1","-ar","16000","-f","s16le","-"],capture_output=True).stdout
    a=np.frombuffer(raw,np.int16).astype(np.float32)/32768
    hop=160  # 10ms
    fr=len(a)//hop
    rms=np.array([np.sqrt(np.mean(a[i*hop:(i+1)*hop]**2))+1e-9 for i in range(fr)])
    db=20*np.log10(rms)
    floor=np.percentile(db,10); peak=np.percentile(db,95)
    th=floor+0.35*(peak-floor)
    act=np.where(db>th)[0]
    on=act[0]/100; off=act[-1]/100
    # coarse 100ms profile
    prof=''.join(' .:-=+*#%@'[min(9,max(0,int((x-floor)/(peak-floor+1e-9)*9)))] for x in db[::10])
    out[n]={"file":f,"dur":len(a)/16000,"on":on,"off":off}
    print(f"T{n:2d} dur={len(a)/16000:.2f} floor={floor:.0f} peak={peak:.0f} on={on:.2f} off={off:.2f} |{prof}|")
json.dump(out,open(sys.argv[2],"w"),indent=1)
