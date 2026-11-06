# Monta a decupagem e as legendas de 2 palavras do Reels "Como ser um marketeiro… Inteligente".
# Marcadores nas páginas:  *palavra = maior/amarela (Anton) · ~palavra = serifada itálica · _palavra = grifada
#                          #  no início da página = página escondida (o grafismo da técnica substitui a legenda)
import json, sys
FPS = 30
T = json.load(open(sys.argv[1]))
W = {int(k): v["words"] for k, v in T.items()}
# take 12: o Whisper ouviu "Que ele" no lugar de "Aquele"
if 12 in W and W[12][0][2] == "Que":
    W[12][0:2] = [[W[12][0][0], W[12][1][1], "Aquele"]]
# take 13: o Whisper ouviu "Ser o" no lugar de "Terceiro"
if 13 in W and W[13][0][2] == "Ser":
    W[13][0:2] = [[W[13][0][0], W[13][1][1], "Terceiro"]]
ON = {int(k): v["on"] for k, v in T.items()}

SPEC = {
 1: "O *garçom | do seu | restaurante ~favorito. | Entende mais | de _marketing | do que | muita *empresa. | Olha só.",
 2: "Primeiro motivo: | #Espera explicada.",
 3: "“Seu prato | sai em | *10 minutos.”",
 4: "Sem essa | frase, | cada minuto | parece *10. | O ~tempo | é o | mesmo, | mas a | _ansiedade some.",
 5: "O segundo | motivo é | #a ancoragem.",
 6: "Na verdade, | ele serve | para a | opção do | _meio | parecer um | ótimo *negócio.",
 7: "Bom, | nem preciso | dizer que | vale para | o seu | *negócio também.",
 8: "Por isso, | muitas vezes | o *bombom | vem em | conjunto com | a _conta. | Justamente | pra conta | não ser | a sua | última ~lembrança.",
 9: "Reparem que | *nenhum desses | princípios | mudou o | ~sabor da | comida, | mas mudou | o que | você _sentiu | durante a | experiência | que esteve | no restaurante.",
 12: "Aquele vinho | *caríssimo | no topo | da carta, | talvez esteja | ali nem | para ser | _vendido.",
 13: "Terceiro princípio: | #O final que fica na mente. | O ser | humano | sempre *lembra | do melhor | ~momento | e de | como *terminou | aquela | experiência.",
 11: "Comenta a | palavra | *INTELIGENTE | que eu | vou mostrar | qual desses | momentos | você está | _desperdiçando | no seu | negócio. | E me | segue para | mais conteúdos. | *Vambora!",
}
# (take, início, fim) em segundos no take original; ("BEAT", frames) = batida sem fala
CUTS = [(1,0.00,4.14),(2,0.15,1.02),(2,1.30,2.60),(3,0.05,1.48),(4,0.18,2.56),(4,2.76,3.60),(4,3.84,5.02),
        (5,0.00,1.76),(12,0.00,4.45),(6,0.00,3.88),(13,0.00,2.42),(13,2.62,5.08),(13,5.16,7.30),
        (8,0.12,6.34),(9,0.00,3.42),(9,3.62,7.24),(11,0.00,5.56),(11,6.00,7.72),(11,7.92,8.60)]

# pareia as palavras da especificação com as palavras do Whisper (mesma contagem por take)
def spec_words(n):
    pages=[]
    for p in SPEC[n].split("|"):
        p=p.strip(); hidden=p.startswith("#"); p=p.lstrip("#")
        toks=[]
        for w in p.split():
            emph=None
            if w[0]=="*": emph="big"; w=w[1:]
            elif w[0]=="~": emph="serif"; w=w[1:]
            elif w[0]=="_": emph="marker"; w=w[1:]
            toks.append(dict(text=w.replace("_"," "),emph=emph))
        pages.append(dict(hidden=hidden,toks=toks))
    return pages

out_clips=[]; pages_out=[]; markers={}; cur=0
for c in CUTS:
    if isinstance(c[0],str):
        markers[c[0]]=(cur,cur+c[1]); cur+=c[1]; continue
    n,a,b=c; fa=round(a*FPS); fb=round(b*FPS); d=fb-fa
    out_clips.append(dict(take=n,trimBefore=fa,from_=cur,dur=d)); 
    words=W[n]; sp=spec_words(n); flat=[t for p in sp for t in p["toks"]]
    assert len(flat)==len(words), (n,len(flat),len(words),[w[2] for w in words])
    k=0
    for p in sp:
        ws=words[k:k+len(p["toks"])]; idx0=k; k+=len(p["toks"])
        s=max(ws[0][0], ON[n] if idx0==0 else 0); e=ws[-1][1]
        if not (a-0.05 <= s and e <= b+0.15): continue          # página fora deste trecho
        st=cur+ (max(s,a)-a)*FPS; en=cur+(min(e,b)-a)*FPS
        if not p["hidden"]:
            pages_out.append(dict(take=n,start=round(st),wordEnd=round(en),tokens=p["toks"]))
        for t,w in zip(p["toks"],ws): markers[f"T{n}:{t['text']}"]=round(cur+(max(w[0],a)-a)*FPS)
    cur+=d
total=cur
# fim de cada página = início da próxima (máx. 0,6 s depois da última palavra)
for i,p in enumerate(pages_out):
    nxt=pages_out[i+1]["start"] if i+1<len(pages_out) else total
    p["end"]=min(nxt, p["wordEnd"]+18) if nxt-p["wordEnd"]>18 else nxt
    p["end"]=max(p["end"],p["start"]+6)
print("TOTAL",total,"frames =",round(total/FPS,2),"s",file=sys.stderr)
for c in out_clips: print("CLIP",c,file=sys.stderr)
print("BEATS",{k:v for k,v in markers.items() if k.startswith("BEAT")},file=sys.stderr)
ts=("// Gerado por scripts/montar.py a partir da transcrição dos takes (faster-whisper + revisão manual).\n"
    "// Tempos em frames (30 fps) na linha do tempo final.\n"
    "export type Emph = 'big' | 'serif' | 'marker';\n"
    "export type Token = {text: string; emph?: Emph | null};\n"
    "export type Page = {start: number; end: number; tokens: Token[]};\n"
    f"export const TOTAL_FRAMES = {total};\n"
    "export const pages: Page[] = "+json.dumps([dict(start=p["start"],end=p["end"],tokens=[{k:v for k,v in t.items() if v is not None} for t in p["tokens"]]) for p in pages_out],ensure_ascii=False)+";\n")
open(sys.argv[2],"w").write(ts)
json.dump(markers,open(sys.argv[3],"w"),ensure_ascii=False,indent=0)
