# usage: python3 shoot.py out_prefix "place:yawoff:pitch:dist:h" ... [--night] [--winter]
import json,sys,subprocess
args=[a for a in sys.argv[2:] if not a.startswith('--')]
pre=sys.argv[1];night='--night' in sys.argv;winter='--winter' in sys.argv
steps=[{"wait":32000},{"js":("S.time='night';" if night else "S.time='day';")+("S.season='winter';" if winter else "S.season='summer';")+"applyTime();1"},{"click":"#bStart"},{"wait":2500}]
for i,a in enumerate(args):
    p=a.split(':')
    if p[0].startswith('xz='):
        x,z,yaw=map(float,p[0][3:].split(','));tp=f"teleportRaw({x},{z},{yaw});"
    else: tp=f"const p=PLACES.find(q=>q.id==='{p[0]}');teleportRaw(p.x,p.z,p.yaw+({p[1] if len(p)>1 and p[1] else 0}));"
    pitch=p[2] if len(p)>2 and p[2] else '.12'
    js="DBGCAM=null;"+tp+f"cam.yaw=player.yaw;cam.pitch={pitch};1"
    if len(p)>3 and p[3]:
        d,h=float(p[3]),float(p[4])
        js+=f";setTimeout(()=>{{DBGCAM=[player.x-Math.sin(player.yaw)*{d},player.y+{h},player.z-Math.cos(player.yaw)*{d},player.x+Math.sin(player.yaw)*{d*0.6},player.y,player.z+Math.cos(player.yaw)*{d*0.6}]}},2500)"
    steps+= [{"js":js},{"wait":6000},{"shot":f"/home/claude/odesa/shots/{pre}_{i}.png"}]
print(json.dumps(steps))
