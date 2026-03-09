import React, { useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useLocation } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const GsapController: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Clean up previous triggers to avoid conflicts on route change
    ScrollTrigger.getAll().forEach(t => t.kill());

    // 1. GLOBAL: Reveal Text Animation (Cyberpunk Decode Style)
    const revealElements = document.querySelectorAll('.gsap-reveal');
    revealElements.forEach((element) => {
      gsap.fromTo(element, 
        { 
          y: 50, 
          opacity: 0, 
          scale: 0.95,
          filter: 'blur(10px)'
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    // 2. HERO: Parallax Background
    const heroBg = document.querySelector('.gsap-hero-bg');
    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    // 3. PROCESS: SEQUENTIAL IMPACT ANIMATION
    const processSection = document.getElementById('process');
    const processLine = document.querySelector('.process-path') as SVGPathElement;
    const processCards = document.querySelectorAll('.gsap-process-card');

    if (processSection && processLine && processCards.length > 0) {
       const length = processLine.getTotalLength();
       
       // Initialize: Line hidden, Cards hidden
       gsap.set(processLine, { strokeDasharray: length, strokeDashoffset: length });
       gsap.set(processCards, { opacity: 0, y: 50, scale: 0.8 });

       const tl = gsap.timeline({
         scrollTrigger: {
           trigger: processSection,
           start: 'top 60%', // Start animation when section is in view
           end: 'bottom 80%',
           scrub: 1, // Fast scrubbing for high energy feel
         }
       });

       // Helper for Shake Animation
       const shakeEffect = (target: Element) => {
         return gsap.to(target, {
           x: 0,
           keyframes: {
             x: [0, -10, 10, -8, 8, -5, 5, 0], // Violent shake
             y: [0, -2, 2, 0] // Slight vertical bump
           },
           duration: 0.4,
           ease: "power1.inOut"
         });
       };

       // Step 1: Draw line to first card (approx 12.5%)
       tl.to(processLine, { strokeDashoffset: length * 0.85, duration: 0.5, ease: "none" })
         // Impact Card 1
         .to(processCards[0], { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "back.out(1.7)" }, "<")
         .add(() => { 
            processCards[0].classList.add('process-card-active'); 
            // Trigger Shake independently of timeline scrubbing to ensure it plays fully
            shakeEffect(processCards[0]);
         }, ">-0.1")
         
       // Step 2: Draw line to second card (approx 37.5%)
         .to(processLine, { strokeDashoffset: length * 0.60, duration: 0.5, ease: "none" })
         // Impact Card 2
         .to(processCards[1], { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "back.out(1.7)" }, "<")
         .add(() => { 
             processCards[1].classList.add('process-card-active');
             shakeEffect(processCards[1]);
         }, ">-0.1")

       // Step 3: Draw line to third card (approx 62.5%)
         .to(processLine, { strokeDashoffset: length * 0.35, duration: 0.5, ease: "none" })
         // Impact Card 3
         .to(processCards[2], { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "back.out(1.7)" }, "<")
         .add(() => { 
             processCards[2].classList.add('process-card-active');
             shakeEffect(processCards[2]);
         }, ">-0.1")

       // Step 4: Draw line to end (100%)
         .to(processLine, { strokeDashoffset: 0, duration: 0.5, ease: "none" })
         // Impact Card 4
         .to(processCards[3], { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "back.out(1.7)" }, "<")
         .add(() => { 
             processCards[3].classList.add('process-card-active');
             shakeEffect(processCards[3]);
         }, ">-0.1");
    }

    // 4. HUD Progress Bar
    const progressBar = document.getElementById('hud-progress-bar');
    if (progressBar) {
      gsap.to(progressBar, {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3
        }
      });
    }

    const timer = setTimeout(() => ScrollTrigger.refresh(), 500);
    return () => clearTimeout(timer);

  }, [location.pathname]); 

  return (
    <div className="fixed right-0 top-0 h-full w-12 pointer-events-none z-40 hidden md:flex flex-col items-center justify-center mix-blend-difference">
      <div className="h-[60%] w-[1px] bg-white/10 relative">
        <div 
          id="hud-progress-bar" 
          className="absolute top-0 left-0 w-full bg-raynold-red shadow-[0_0_10px_#E60000]" 
          style={{ height: '0%' }}
        />
        <div className="absolute top-0 -left-2 text-[8px] font-mono text-gray-500">00</div>
        <div className="absolute top-1/4 -left-2 w-2 h-[1px] bg-white/20"></div>
        <div className="absolute top-2/4 -left-2 w-3 h-[1px] bg-white/40"></div>
        <div className="absolute top-3/4 -left-2 w-2 h-[1px] bg-white/20"></div>
        <div className="absolute bottom-0 -left-2 text-[8px] font-mono text-gray-500">100</div>
      </div>
    </div>
  );
};

export default GsapController;