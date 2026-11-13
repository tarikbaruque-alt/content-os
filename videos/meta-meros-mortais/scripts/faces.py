import cv2, json, sys, numpy as np
P=sys.argv[1]  # pasta takes (1080x1920)
casc=cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_frontalface_default.xml')
KS=['01','02','03','04','05','06','07','08','09','10','11','12b','13','14','15','16','17','18','19','20','21','22','23','24']
res={}
for k in KS:
    cap=cv2.VideoCapture(f'{P}/t{k}.mp4'); n=int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); boxes=[]
    for i in range(0,n,4):
        cap.set(cv2.CAP_PROP_POS_FRAMES,i); ok,fr=cap.read()
        if not ok: continue
        g=cv2.cvtColor(cv2.resize(fr,(540,960)),cv2.COLOR_BGR2GRAY)
        f=casc.detectMultiScale(g,1.1,6,minSize=(120,120))
        if len(f):
            x,y,w,h=max(f,key=lambda r:r[2]*r[3]); boxes.append((2*(x+w/2),2*(y+h/2),2*w))
    b=np.array(boxes)
    m=np.median(b,axis=0) if len(b) else None
    res[k]=[round(float(m[0])),round(float(m[1])),round(float(m[2]))] if m is not None else None
    print(k,len(b),res[k], None if not len(b) else np.round(b.std(axis=0),1))
json.dump(res,open(sys.argv[2],'w'))
