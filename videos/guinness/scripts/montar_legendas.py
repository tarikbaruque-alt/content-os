import json, sys
d=json.load(open(sys.argv[1]))
EMPH={1:{"cervejaria":"gold","discussões":"gold","famosos":"gold"},
2:{"1951,":"date","Irlanda.":"gold"},
3:{"Guinness":"gold","rápida":"gold","Europa.":"gold","ninguém":"gold","nenhum":"gold"},
4:{"bares.":"gold"},
5:{"três":"gold","1951":"date","Google.":"gold"},
6:{"1954,":"date","especialistas":"gold","discussões.":"gold"},
7:{"1955,":"date","Guinness":"gold","Book of":"gold","World":"gold","Records.":"gold"},
8:{"Natal,":"gold","sucesso":"gold","Reino":"gold","Unido.":"gold"},
10:{"genialidade:":"gold","propaganda,":"strike","resposta":"gold"},
11:{"marca":"gold","conversas":"gold"},
12:{"pergunta":"gold","conteúdo.":"gold"},
13:{"vender":"strike","responder.":"gold"},
14:{"pássaros":"gold","famosos":"gold"},
15:{"Atrás do Rótulo.":"gold","sigam":"gold"}}
HIDE=[(750,872),(1467,1604)]
FPS=30
words=[w for w in d["words"] if not any(a*1000/FPS<=w["startMs"]<b*1000/FPS for a,b in HIDE)]
pages=[]; cur=[]
def flush():
    global cur
    if cur: pages.append(cur); cur=[]
MAXC=27
FUNC={'de','do','da','dos','das','a','o','as','os','um','uma','e','em','no','na','nos','que','pra','com','sua','seus','é','mais','não'}
for i,w in enumerate(words):
    t=w["text"]; L=sum(len(x["text"])+1 for x in cur)
    if cur and (w["take"]!=cur[-1]["take"] or w["startMs"]-cur[-1]["toMs"]>380):
        flush()
    elif cur and L+len(t)>MAXC:
        carry=[]
        while len(cur)>1 and cur[-1]["text"].lower() in FUNC: carry.insert(0,cur.pop())
        flush(); cur=carry
    cur.append(dict(text=t,fromMs=w["startMs"],toMs=w["endMs"],take=w["take"],emph=EMPH.get(w["take"],{}).get(t)))
    L=sum(len(x["text"])+1 for x in cur)
    if t[-1] in ".!?:" and L>=10: flush()
    elif t[-1] in "," and L>=16: flush()
flush()
out=[]
for i,p in enumerate(pages):
    start=p[0]["fromMs"]; nxt=pages[i+1][0]["fromMs"] if i+1<len(pages) else p[-1]["toMs"]+600
    end=min(nxt, p[-1]["toMs"]+700, round(d['total']*1000/FPS))
    out.append(dict(startMs=start,endMs=end,tokens=[dict(text=x["text"],fromMs=x["fromMs"],toMs=x["toMs"],**({"emph":x["emph"]} if x["emph"] else {})) for x in p]))
for p in out: print(round(p["startMs"]*30/1000), round(p["endMs"]*30/1000), " ".join(t["text"]+("*" if t.get("emph") else "") for t in p["tokens"]))
ts="// Gerado a partir da transcrição dos takes (faster-whisper + revisão manual).\n// Tempos em milissegundos na linha do tempo final do vídeo.\nexport type Emph = 'gold' | 'date' | 'strike';\nexport type CaptionToken = {text: string; fromMs: number; toMs: number; emph?: Emph};\nexport type CaptionPageData = {startMs: number; endMs: number; tokens: CaptionToken[]};\n\nexport const captionPages: CaptionPageData[] = "+json.dumps(out,ensure_ascii=False,indent=1)+";\n"
open(sys.argv[2],"w").write(ts)
