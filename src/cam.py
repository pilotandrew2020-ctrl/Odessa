# python3 cam.py prefix "EXPR_TARGET_XZ(js returning [x,y,z])|dist|height|angle" ...  (camera orbit shots around a point)
import json,sys
pre=sys.argv[1];steps=[{"wait":32000},{"click":"#bStart"},{"wait":2000}]
night='--night' in sys.argv
if night: steps.insert(1,{"js":"S.time='night';applyTime();1"})
for i,a in enumerate([x for x in sys.argv[2:] if not x.startswith('--')]):
    expr,d,h,ang=a.split('|')
    js=f"const T=({expr});teleportRaw(T[0]+Math.sin({ang})*({d}),T[2]+Math.cos({ang})*({d}),0);DBGCAM=null;setTimeout(()=>{{DBGCAM=[T[0]+Math.sin({ang})*({d}),T[1]+({h}),T[2]+Math.cos({ang})*({d}),T[0],T[1]+({h})*.35,T[2]]}},1500);1"
    steps+=[{"js":js},{"wait":7000},{"shot":f"/home/claude/odesa/shots/{pre}_{i}.png"}]
print(json.dumps(steps))
