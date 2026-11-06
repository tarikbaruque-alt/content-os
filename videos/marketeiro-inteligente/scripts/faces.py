import cv2, json, sys, numpy as np
P='/home/user/content-os/videos/marketeiro-inteligente/public/takes/'
casc=cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_frontalface_default.xml')
# trechos usados de cada take (s)
USE={1:(0,4.62),2:(0.15,2.6),3:(0.05,1.48),4:(0.18,5.02),5:(0,1.76),6:(0,3.88),7:(0.02,2.66),8:(0.12,6.34),9:(0,7.24),11:(0,8.6)}
res={}
for n,(a,b) in USE.items():
    cap=cv2.VideoCapture(P+f'take{n:02d}.mp4'); boxes=[]
    t=a
    while t<b:
        cap.set(cv2.CAP_PROP_POS_MSEC,t*1000); ok,fr=cap.read()
        if ok:
            g=cv2.cvtColor(cv2.resize(fr,(540,960)),cv2.COLOR_BGR2GRAY)
            f=casc.detectMultiScale(g,1.1,6,minSize=(120,120))
            if len(f): x,y,w,h=max(f,key=lambda r:r[2]*r[3]); boxes.append((2*(x+w/2),2*(y+h/2),2*h))
        t+=0.2
    bx=np.array(boxes); m=np.median(bx,axis=0) if len(bx) else None
    res[n]=dict(xc=float(m[0]),yc=float(m[1]),h=float(m[2]),n=len(bx),sx=float(bx[:,0].std()),sy=float(bx[:,1].std()))
    print(n, {k:round(v,1) for k,v in res[n].items()})
json.dump(res,open('faces.json','w'),indent=1)
