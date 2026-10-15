import re, glob, os
src=''
for f in glob.glob('app/**/*.js',recursive=True)+glob.glob('components/**/*.js',recursive=True)+glob.glob('app/**/*.tsx',recursive=True):
    src+=open(f,encoding='utf-8').read()+'\n'

BASE='#13161B'; SURF2='#1C2027'; SURF3='#272C35'
TEXT={ # claro -> oscuro
 '14213d':'#ECEEF2','1d1d1f':'#ECEEF2','16181d':'#ECEEF2',
 '6e6e73':'#A0A6B4','6b7894':'#A0A6B4','7a7f8c':'#9AA0AE','4a4f5c':'#B8BDC9','4b4f5c':'#B8BDC9','4b5873':'#B8BDC9',
 '8a8f9c':'#8B91A0','a1a1a6':'#8B91A0','a3a8b3':'#7B8190','9a9eab':'#8B91A0',
 'd2d2d7':'#5A6070','c5c8d2':'#5A6070','d5d8e0':'#5A6070',
 '0a66e0':'#6AA6FF','0a4fd6':'#7BB0FF','cfe0ff':'#CFE0FF',
 'd92d20':'#FF7468','b42318':'#FF8A80','b0453b':'#FF8A80','7a1f17':'#FFB3AB',
 'b45309':'#F5B84B','92400e':'#F5B84B','8a4a07':'#F5B84B','5c4a00':'#F5D36B','8a6a00':'#F5D36B','b58900':'#F5D36B',
 '7c5cfc':'#A892FF','1877f2':'#5B9DFF',
}
BG={
 '14213d':'#2A3550','1d1d1f':'#2B313C','16181d':'#2B313C','000000':'#3A4150',
 'f5f5f7':SURF2,'f4f6fa':SURF2,'f1f2f5':SURF2,'f1f1f3':SURF2,'f6f7f9':SURF2,'f6f8fb':SURF2,'eef3f8':SURF2,'f3f8ff':SURF2,'fafbfd':SURF2,
 'e8eaee':SURF3,'e2e2e7':SURF3,'e8e8ed':SURF3,'e4e4e8':SURF3,'c5c8d2':'#4A5160',
 'eaf2fe':'rgba(106,166,255,.16)','dbe9fd':'rgba(106,166,255,.24)','d9e8fc':'rgba(106,166,255,.24)',
 'fceae9':'rgba(255,116,104,.16)','f9d9d6':'rgba(255,116,104,.26)',
 'fef3e2':'rgba(245,184,75,.16)','fff6d9':'rgba(245,184,75,.16)',
}
BORDER={k:'#2C323C' for k in ['e6e8ef','e2e2e7','e2e8f0','f0f1f5','e8eaee','f0f0f3','d9dce3','dce6f5','c7d6ea','c7d9f8','b8d2f7','f5d9a8','f5c6c2']}
BORDER.update({'c2c6d0':'#3A414D'})
GRAD={'f3f8ff':SURF2}

def esc(tok):
    return re.sub(r'([\[\]#/:.%])',r'\\\1',tok)

tokens=set(re.findall(r'(?<![\w-])((?:[a-z-]+:)*(?:bg|text|border|from|via|to|placeholder)-(?:\[#[0-9A-Fa-f]{3,8}\]|white|black)(?:/[0-9]+)?)',src))
rules=[]
def decl(prop,variant_prefix,val):
    return val
out=[]
for t in sorted(tokens):
    parts=t.split(':'); base=parts[-1]; variants=parts[:-1]
    m=re.match(r'(bg|text|border|from|via|to|placeholder)-(?:\[#([0-9A-Fa-f]{3,8})\]|(white|black))(?:/([0-9]+))?$',base)
    if not m: continue
    kind,hexv,named,op=m.groups(); hexv=(hexv or '').lower()
    css=None
    if named=='white':
        if kind=='bg':
            a=(int(op)/100) if op else 1
            css=f'background-color:{BASE}' if a==1 else f'background-color:rgba(19,22,27,{a})'
            if variants==['hover']: css='background-color:%s'%SURF2
            if op and int(op)<50: css=None
        elif kind=='border' and not op: css=f'border-color:{BASE}'
        elif kind in('from','via','to'):
            a=(int(op)/100) if op else 1
            var={'from':'--tw-gradient-from','via':'--tw-gradient-via','to':'--tw-gradient-to'}[kind]
            css=f'{var}:rgba(19,22,27,{a})'
    elif named=='black': css=None
    else:
        if kind=='text' and hexv in TEXT and not op: css=f'color:{TEXT[hexv]}'
        elif kind=='bg' and hexv in BG and not op: css=f'background-color:{BG[hexv]}'
        elif kind=='border' and hexv in BORDER and not op: css=f'border-color:{BORDER[hexv]}'
        elif kind in('from','via','to') and hexv in GRAD:
            var={'from':'--tw-gradient-from','via':'--tw-gradient-via','to':'--tw-gradient-to'}[kind]
            css=f'{var}:{GRAD[hexv]}'
    if not css: continue
    sel='.'+esc(t)
    for v in variants:
        if v in('hover','focus','active'): sel+=':'+v
        elif v=='focus-within': sel+=':focus-within'
        else: sel=None; break
    if sel: out.append(f'  {sel} {{ {css}; }}')
body='\n'.join(out)
css=f'''/* Modo oscuro automático (según el dispositivo del cliente).
   GENERADO con las clases que usa la app: los colores claros se reasignan aquí,
   sin tocar cada pantalla. Las reglas sin capa ganan a las utilidades de Tailwind. */
@media (prefers-color-scheme: dark) {{
  :root {{
    color-scheme: dark;
    --background: {BASE};
    --foreground: #ECEEF2;
    --tinta: #2B313C;
    --texto: #ECEEF2;
    --tinta-2: #B8BDC9;
    --tinta-3: #8B91A0;
    --linea: #2C323C;
    --linea-suave: #272C35;
    --superficie: #1C2027;
    --campo: #171A20;
    --azul-texto: #6AA6FF;
    --graf-marino: #9FB4E8;
    --graf-linea: #272C35;
    --graf-texto: #ECEEF2;
    --graf-sub: #A0A6B4;
  }}
  body {{ background: {BASE}; color: #ECEEF2; }}

{body}

  .f-input::placeholder, .f-grupo > input::placeholder {{ color: #6B7180; }}
  select.f-input {{ background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' stroke='%238b91a0' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); }}

  /* Panel de administración */
  body:has(.safo-sidebar) {{ background: #0F1115; }}
  .tarjeta {{ background: #171A20; border-color: #2C323C; }}
  .tarjeta-sombra {{ box-shadow: none; }}
  .safo-zona-etiqueta {{ background: rgba(19,22,27,.85); color: #ECEEF2; }}
  .mapa-suave .leaflet-control-attribution {{ background: rgba(19,22,27,.8); }}

  /* Mapas: mosaicos de OpenStreetMap en versión oscura */
  .leaflet-tile-pane {{ filter: invert(1) hue-rotate(180deg) brightness(.92) contrast(.88) saturate(.7); }}
  .mapa-suave .leaflet-tile-pane {{ filter: invert(1) hue-rotate(180deg) grayscale(.7) brightness(.8) contrast(.9); }}
  .leaflet-container {{ background: #1A1D23; }}
  .leaflet-control-attribution {{ background: rgba(19,22,27,.8) !important; color: #8B91A0 !important; }}
  .leaflet-control-attribution a {{ color: #6AA6FF !important; }}
  .leaflet-bar a, .leaflet-bar a:hover {{ background: #171A20; color: #ECEEF2; border-color: #2C323C; }}
  .leaflet-popup-content-wrapper, .leaflet-popup-tip {{ background: #171A20; color: #ECEEF2; }}

  /* Ilustraciones claras: un poco más tenues para que no deslumbren */
  svg[role="img"][aria-label^="Ilustración"] {{ filter: brightness(.88) saturate(.95); }}
  img {{ color-scheme: normal; }}
}}
'''
G='app/globals.css'
t=open(G,encoding='utf-8').read()
t=t.replace('@import "./tema-oscuro.css";\n','')
i=t.find('/* ===== MODO OSCURO')
if i>=0: t=t[:i]
t=t.rstrip()+'\n\n/* ===== MODO OSCURO (generado: scripts/generar-tema-oscuro.py) ===== */\n'+css
open(G,'w',encoding='utf-8').write(t)
print(len(out),'reglas')
