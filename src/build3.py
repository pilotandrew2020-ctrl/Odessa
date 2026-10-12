import sys,os
import os
B=os.path.dirname(os.path.abspath(__file__))+'/'
shell=open(B+'src3/shell2.html').read()
mods=['o_core.js','o_tex.js','o_mats.js','o_build.js','o_world.js','o_trees.js','o_land2.js','o_home3.js','o_opera.js','o_station.js','o_port.js','o_parks.js','o_lanz.js','o_people.js','o_cars.js','o_drive.js','o_trams.js','o_interiors.js','o_azs.js','o_audio.js','o_game.js','o_coop.js','o_hide.js']
js='\n'.join(open(B+'src3/'+f).read() for f in mods if os.path.exists(B+'src3/'+f))
open(B+'src3/_all.js','w').write(js)
hdr=open(B+'data/hdr3.json').read(); b64=open(B+'data/blob3.b64').read()
EX='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/'
libs=['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js']+[EX+p for p in ['postprocessing/EffectComposer.js','postprocessing/RenderPass.js','postprocessing/ShaderPass.js','shaders/CopyShader.js','shaders/LuminosityHighPassShader.js','postprocessing/UnrealBloomPass.js','shaders/FXAAShader.js','shaders/GammaCorrectionShader.js','objects/Sky.js']]
tags='\n'.join('<script src="%s"></script>'%u for u in libs)
debug='--debug' in sys.argv
html=shell+'\n'+tags+'\n<script>'+open(B+'vendor/peerjs.min.js').read()+'</script>'+'\n<script type="application/json" id="odhdr">'+hdr+'</script>\n<script type="text/plain" id="oddata">'+b64+'</script>\n<script>\n'+js+('\nwindow.__g={eval:s=>eval(s)};' if debug else '')+'\nboot();\n</script>\n'
out=B+('odesa3_debug.html' if debug else 'odesa.html')
open(out,'w').write(html);print(out,len(html))
