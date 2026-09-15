const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];

export function createChoreography() {
  const media=gsap.matchMedia();
  media.add({desktop:'(min-width:801px)',mobile:'(max-width:800px)',motion:'(prefers-reduced-motion:no-preference)'},context=>{
    if(!context.conditions.motion)return;
    const mobile=context.conditions.mobile, splits=[];
    function heading(selector,hero=false){
      if(!window.SplitText)return;
      const element=$(selector);
      const split=SplitText.create(element,{type:'lines',mask:'lines',linesClass:'title-line',autoSplit:true,aria:'auto',onSplit(self){
        return gsap.from(self.lines,{yPercent:105,duration:hero?.85:.75,stagger:.11,ease:'power3.out',delay:hero?.15:0,
          ...(hero?{}:{scrollTrigger:{trigger:element,start:'top 93%',once:true}})});
      }});splits.push(split);
    }
    heading('#hero-title',true);
    ['#portfolio-title','#expertise-title','#studio-title','#contact-title'].forEach(selector=>heading(selector));
    const intro=gsap.timeline({defaults:{ease:'power2.out'},scrollTrigger:{trigger:$('.hero'),start:'top bottom',end:'bottom top',toggleActions:'play pause resume pause'}});
    if(window.DrawSVGPlugin)intro.from($$('.hero-lines path').reverse(),{drawSVG:'0% 0%',duration:.95,stagger:.065},0);
    intro.from($('.hero-panel'),{x:mobile?-10:-24,duration:.85,clearProps:'transform'},0)
      .fromTo($('.hero-light'),{xPercent:-120,opacity:0},{xPercent:160,opacity:.7,duration:3.8,ease:'sine.inOut'},0)
      .to($('.hero-light'),{opacity:0,duration:.3},3.5);
    // Each property has one owner: entrance light, scroll photo, panel typography.
    gsap.fromTo($('.hero-image picture'),{scale:1.035,yPercent:0},{scale:1.07,yPercent:mobile?1:3,ease:'none',scrollTrigger:{trigger:$('.hero'),start:'top top',end:'bottom top',scrub:.8}});
    gsap.from($('.project-photos'),{'--frame-reveal':0,duration:1.25,ease:'power3.inOut',scrollTrigger:{trigger:$('.project-photos'),start:'top 90%',once:true}});
    gsap.fromTo($('.project-detail'),{y:mobile?8:30},{y:mobile?-5:-18,ease:'none',scrollTrigger:{trigger:$('.portfolio-layout'),start:'top 85%',end:'bottom 20%',scrub:.65}});
    const material=gsap.timeline({scrollTrigger:{trigger:$('.spatial-frame'),start:'top 85%',end:'bottom 15%',scrub:.65},defaults:{ease:'none'}});
    material.fromTo($('.material-progress span'),{scaleX:0},{scaleX:1},0)
      .fromTo($('.scene-hairline'),{yPercent:-7},{yPercent:7},0)
      .fromTo($$('.spatial-caption span'),{y:7,opacity:.45},{y:0,opacity:1,stagger:.16},0);
    $$('.services article').forEach((article,index)=>{
      gsap.from(article,{'--rule':0,duration:.9,delay:index*.07,ease:'power2.inOut',scrollTrigger:{trigger:article,start:'top 91%',once:true}});
      gsap.from(article.querySelector('h3'),{x:18,duration:.65,scrollTrigger:{trigger:article,start:'top 91%',once:true},clearProps:'transform'});
    });
    const portrait=gsap.timeline({scrollTrigger:{trigger:$('.portrait-frame'),start:'top 88%',end:'bottom 32%',scrub:.6}});
    portrait.fromTo($('.portrait-plane'),{x:mobile?8:24,scaleX:.65},{x:0,scaleX:1,transformOrigin:'left',ease:'none'},0);
    if(window.DrawSVGPlugin)portrait.from($$('.portrait-lines path'),{drawSVG:0,stagger:.12,ease:'none'},0);
    if(window.DrawSVGPlugin){
      const plan=gsap.timeline({scrollTrigger:{trigger:$('.contact-aside'),start:'top 90%',end:'center 48%',scrub:.55},defaults:{ease:'none'}});
      plan.from($$('.plan-line'),{drawSVG:'0% 0%',duration:1,stagger:.12},0)
        .from($$('.plan-door'),{drawSVG:0,duration:.5,stagger:.15},1)
        .from($('.plan-route'),{drawSVG:0,duration:1.1},1.2);
    }
    // Revert responsive text wrappers as well as their returned animations.
    return ()=>splits.forEach(split=>split.revert());
  });
  return media;
}
