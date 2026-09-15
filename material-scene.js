import * as THREE from './vendor/three.module.js';
import WebGL from './vendor/WebGL.js';

// 2D light and material shaders meet a shallow, orthographic architectural relief.
export function mountScene(container, gsap, ScrollTrigger) {
  if (!WebGL.isWebGL2Available()) return () => {};
  let renderer;
  try {renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});} catch {return () => {};}
  const scene=new THREE.Scene(), camera=new THREE.OrthographicCamera(-4,4,3.3,-3.3,.1,30);
  camera.position.set(.7,.18,10);camera.lookAt(0,0,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor('#d5c6ae');
  const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');container.append(canvas);
  const geometries=new Set(),materials=new Set();
  const state={progress:0,entrance:0,pointerX:0,pointerY:0};
  const uniforms={uProgress:{value:0},uEntrance:{value:0},uPointer:{value:new THREE.Vector2()},uStone:{value:new THREE.Color('#d6c7ad')},uShade:{value:new THREE.Color('#817665')},uLight:{value:new THREE.Color('#fff4dc')}};
  const vertexShader=`varying vec2 vSurface;
    void main(){vSurface=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
  const fragmentShader=`varying vec2 vSurface;
    uniform float uProgress;uniform float uEntrance;uniform vec2 uPointer;
    uniform vec3 uStone;uniform vec3 uShade;uniform vec3 uLight;
    float grain(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){
      vec2 p=vSurface;
      float drift=uProgress*1.4+uPointer.x*.18+(1.0-uEntrance)*.6;
      float diagonal=p.x+p.y*.47-drift;
      float light=smoothstep(-3.9,-2.8,diagonal)*(1.0-smoothstep(1.7,3.1,diagonal));
      float stripe=sin((diagonal+.2)*7.8);
      float shade=smoothstep(-.15,.75,stripe)*smoothstep(-3.2,-2.1,diagonal)*(1.0-smoothstep(2.0,3.3,diagonal));
      float edge=smoothstep(-3.5,3.0,p.y+uPointer.y*.1);
      vec3 col=mix(uStone*.9,uStone,edge);
      col=mix(col,uLight,light*.55);col=mix(col,uShade,shade*.32);
      col+=(grain(p*135.0)-.5)*.023;
      gl_FragColor=vec4(col,1.0);
      #include <colorspace_fragment>
    }`;
  const plaster=new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader,toneMapped:false});materials.add(plaster);
  const standard=color=>{const mat=new THREE.MeshStandardMaterial({color,roughness:.94});materials.add(mat);return mat;};
  const edgeMaterial=standard('#b3a083'),finMaterial=standard('#b9a282'),recessMaterial=standard('#807969');
  function mesh(geometry,material,x=0,y=0,z=0){geometries.add(geometry);const item=new THREE.Mesh(geometry,material);item.position.set(x,y,z);scene.add(item);return item;}
  mesh(new THREE.PlaneGeometry(18,14),recessMaterial,0,0,-.85);
  const wall=new THREE.Shape();wall.moveTo(-9,-5);wall.lineTo(9,-5);wall.lineTo(9,5);wall.lineTo(-9,5);wall.closePath();
  const opening=new THREE.Path();
  opening.moveTo(-1.9,-3.6);opening.lineTo(-1.9,1.05);opening.quadraticCurveTo(-1.9,2.3,-.65,2.3);
  opening.lineTo(.25,2.3);opening.quadraticCurveTo(.65,2.3,.65,1.9);opening.lineTo(.65,-3.6);opening.closePath();wall.holes.push(opening);
  mesh(new THREE.ExtrudeGeometry(wall,{depth:.32,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,steps:1,curveSegments:32}),[plaster,edgeMaterial]);
  const rearLight=mesh(new THREE.PlaneGeometry(2.15,6),plaster,-.5,0,-.78);rearLight.rotation.z=-.035;
  mesh(new THREE.BoxGeometry(3,.055,.7),edgeMaterial,-.6,-1.95,-.44);
  const fins=[];
  for(let i=0;i<7;i++){const fin=mesh(new THREE.BoxGeometry(.075,10,.45),finMaterial,1.24+i*.48,.2,.59);fin.rotation.y=-.3;fins.push(fin);}
  scene.add(new THREE.HemisphereLight(0xfff3dc,0x766954,2.5));
  const sunlight=new THREE.DirectionalLight(0xfff6e2,3.2);sunlight.position.set(-4,6,7);scene.add(sunlight);
  let visible=false,disposed=false,frame=0,shaderFailed=false;
  renderer.debug.onShaderError=()=>{shaderFailed=true;};
  function paint(){
    frame=0;if(disposed||!visible||document.hidden)return;
    uniforms.uProgress.value=state.progress;uniforms.uEntrance.value=state.entrance;uniforms.uPointer.value.set(state.pointerX,state.pointerY);
    fins.forEach((fin,i)=>{fin.rotation.y=-.3+state.progress*.55;fin.position.z=.59+state.progress*(.1+i*.012);});
    camera.position.x=.7+state.progress*.22;camera.lookAt(0,0,0);
    renderer.render(scene,camera);if(shaderFailed){dispose();return;}container.dataset.ready='true';
  }
  function requestRender(){if(!frame&&visible&&!document.hidden&&!disposed)frame=requestAnimationFrame(paint);}
  function resize(){
    if(disposed)return;const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;
    const aspect=w/h;camera.left=-3.3*aspect;camera.right=3.3*aspect;camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio,w<600?1:1.5));renderer.setSize(w,h,false);requestRender();
  }
  let entrance;
  const context=gsap.context(()=>{
    entrance=gsap.to(state,{entrance:1,duration:3.2,ease:'sine.inOut',paused:true,onUpdate:requestRender});
    gsap.to(state,{progress:1,ease:'none',onUpdate:requestRender,scrollTrigger:{trigger:container,start:'top 85%',end:'bottom 15%',scrub:.65}});
  },container);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){if(!document.hidden)entrance.play();requestRender();}else{entrance.pause();container.removeAttribute('data-ready');}},{threshold:.01});observer.observe(container);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);
  const events=new AbortController();
  document.addEventListener('visibilitychange',()=>{if(document.hidden)entrance.pause();else if(visible){entrance.play();requestRender();}},{signal:events.signal});
  let pointerX,pointerY;
  context.add(()=>{pointerX=gsap.quickTo(state,'pointerX',{duration:.7,ease:'power2.out',onUpdate:requestRender});pointerY=gsap.quickTo(state,'pointerY',{duration:.7,ease:'power2.out',onUpdate:requestRender});});
  container.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse')return;const r=container.getBoundingClientRect();pointerX((event.clientX-r.left)/r.width-.5);pointerY(.5-(event.clientY-r.top)/r.height);},{signal:events.signal,passive:true});
  container.addEventListener('pointerleave',()=>{pointerX(0);pointerY(0);},{signal:events.signal});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();dispose();},{signal:events.signal});
  resize();
  function dispose(){
    if(disposed)return;disposed=true;cancelAnimationFrame(frame);context.revert();events.abort();observer.disconnect();resizeObserver.disconnect();
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();canvas.remove();container.removeAttribute('data-ready');
  }
  return dispose;
}
