import json, re, sys
FPS=30
T=json.load(open(sys.argv[1]))
W={int(re.search(r"_-_(\d+)",k).group(1)):[list(x) for x in v["words"]] for k,v in T.items()}
# ---- text corrections (whisper -> final) ----
def setw(t,i,txt,s=None,e=None):
    W[t][i][2]=txt
    if s is not None: W[t][i][0]=s
    if e is not None: W[t][i][1]=e
def split(t,i,a,b,mid):
    s,e,_=W[t][i]; W[t][i:i+1]=[[s,mid,a],[mid,e,b]]
def merge(t,i,j,txt):
    s=W[t][i][0]; e=W[t][j][1]; W[t][i:j+1]=[[s,e,txt]]
setw(3,17,"E")
# T5 quotes
w5=[x[2] for x in W[5]]
setw(5,6,"frases:"); setw(5,7,"“Tenho"); setw(5,8,"certeza.”"); setw(5,9,"“Aposto"); setw(5,12,"quiser.”"); setw(5,13,"“Vai"); setw(5,16,"Google.”")
setw(6,9,"pesquisa"); setw(6,11,"fatos")
split(7,0,"Em","1955,",0.22)
setw(7,6,"Book of")
setw(8,0,"Resultado:")
setw(10,0,"Repara"); setw(10,2,"genialidade:")
# T14: sobre a Pássaro, visitando -me -> sobre pássaros e terminou
merge(14,5,6,"pássaros"); 
i=[x[2] for x in W[14]].index("visitando"); merge(14,i,i+1,"terminou"); W[14].insert(i,[W[14][i][0],W[14][i][0]+0.08,"e"]); W[14][i+1][0]+=0.08
# T15
i=[x[2] for x in W[15]].index("atrás"); merge(15,i,i+2,"Atrás do Rótulo.")
setw(15,[x[2] for x in W[15]].index("dizer,"),"dizer:")
for k,x in enumerate(W[15]):
    if x[2]=="para": x[2]="pra"
W[15][-1][2]="cima!"
for x in W[15]:
    if x[2]=="por": x[2]="Por"
W[15][-3][2]="vão bora"
setw(12,0,"Quer")
for t in W: print(t," ".join(x[2] for x in W[t]),file=sys.stderr)
# ---- cut list: (take, srcStart, srcEnd) ----
SEG=[(1,0.40,3.75),(1,3.97,7.70),(2,0.0,3.26),(3,0.18,9.35),(4,0.15,3.38),(5,0.30,9.40),(6,0.0,5.08),(6,5.36,9.20),(7,0.0,3.60),(8,0.0,4.58),(9,0.0,4.62),(10,0.0,6.25),(11,0.0,3.92),(12,0.0,6.02),(12,6.72,8.32),(13,0.15,4.18),(14,0.0,4.60),(15,0.0,6.27),(15,6.74,8.42)]
out=0; clips=[]; words=[]
for (t,a,b) in SEG:
    fa=round(a*FPS); fb=round(b*FPS); d=fb-fa
    clips.append(dict(take=t,trimBefore=fa,from_=out,dur=d))
    for (s,e,txt) in W[t]:
        if a+0.05 < e <= b+0.12 or (s < b-0.05 and e > b+0.12 and (b-s) > (e-b)):
            ss=max(s,a); ee=min(e,b)
            words.append(dict(text=txt,take=t,startMs=round((out/FPS+ss-a)*1000),endMs=round((out/FPS+ee-a)*1000)))
    out+=d
print("TOTAL frames",out,out/FPS,file=sys.stderr)
for c in clips: print(c,file=sys.stderr)
json.dump(dict(clips=clips,words=words,total=out),open(sys.argv[2],"w"),ensure_ascii=False,indent=1)
