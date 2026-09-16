"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import "./team-3d.css";

const teamData = [
  { id: "ameema", name: "Ameema Waheed", role: "Administrative Co-Lead", badge: "ITCN Asia & JUW Lead", filename: "/team/ameema-waheed.jpeg", initials: "AW", accent: "#ec4899", tagline: "Empowering young women in computing & leading collaborative tech summits.", bio: "Ameema is a prominent student leader from Jinnah University for Women and Karachi Lead at DevQuest. Recognized at ITCN Asia for cultivating developer communities.", skills: ["Community Architecture", "Tech Leadership", "Event Strategy"], quote: "Innovation begins when we create spaces where every mind can thrive." },
  { id: "ammar", name: "Ammar Shafique", role: "Strategy & Corporate Operations Lead", badge: "Corporate Partnerships", filename: "/team/ammar-shafique.jpeg", initials: "AS", accent: "#3b82f6", tagline: "Driving enterprise growth, strategic alliances, and operational execution.", bio: "Ammar directs business development and cross-functional operations, aligning industry sponsors and partners with high-impact community programs.", skills: ["Corporate Strategy", "Partnerships", "Operations Planning"], quote: "Execution is the bridge between ambitious vision and lasting reality." },
  { id: "anza", name: "Anza Tamveel", role: "Social Media Co-Lead", badge: "Full-Stack Dev", filename: "/team/anza-tamveel.jpeg", initials: "AT", accent: "#10b981", tagline: "Transforming complex logic into seamless, high-performance digital apps.", bio: "Anza specializes in modern React/Next.js development, creative frontend engineering, and interactive design systems.", skills: ["React & Next.js", "TypeScript", "UI Architecture"], quote: "Exceptional software makes complex workflows feel completely effortless." },
  { id: "areesha", name: "Areesha Khan", role: "Technical Lead", badge: "Executive Director", filename: "/team/areesha-khan.jpeg", initials: "AK", accent: "#8b5cf6", tagline: "Curating impactful brand narratives, keynotes, and experiential tech events.", bio: "Areesha oversees brand positioning, media partnerships, and multi-speaker conferences uniting developers and industry leaders.", skills: ["Brand Strategy", "Event Production", "Public Relations"], quote: "Compelling stories spark movements and inspire communities to build." },
  { id: "humair", name: "Humair Tariq", role: "Senior Technical Lead", badge: "Core Lead / MNS UET", filename: "/team/humair-tariq.webp", initials: "HT", accent: "#f59e0b", tagline: "Architecting resilient distributed systems, developer tools, and web ecosystems.", bio: "Humair is a Computer Science engineer at MNS UET and full-stack systems architect. He builds scalable platforms, cloud backends, and developer initiatives.", skills: ["Cloud Architecture", "Next.js / TypeScript", "Database Systems"], quote: "Build what matters. Code cleanly, architect boldly, and empower your community." },
  { id: "khadija", name: "Khadija Faheem", role: "Public Relations & TEDx Ambassador", badge: "TEDx Speaker & Lead", filename: "/team/khadija-faheem.png", initials: "KF", accent: "#f43f5e", tagline: "Championing youth leadership, ideas worth spreading, and impactful rhetoric.", bio: "Khadija is a TEDx organizer, youth orator, and advocate for student empowerment and technology leadership.", skills: ["TEDx Curation", "Keynote Speaking", "Youth Mentorship"], quote: "Speaking with conviction turns promising ideas into tangible movements." },
  { id: "madeeha", name: "Madeeha Talib", role: "Operations Lead", badge: "UI/UX & Design Systems", filename: "/team/madeeha-talib.jpeg", initials: "MT", accent: "#a855f7", tagline: "Crafting accessible user experiences, interface patterns, and design systems.", bio: "Madeeha leads UX research and product design strategy, bridging complex functional requirements with intuitive interfaces.", skills: ["Figma Systems", "Interaction Design", "User Testing"], quote: "Design is not just what it looks like. Design is how it works." },
  { id: "mohsin", name: "Mohsin Nawaz", role: "Administrative Lead", badge: "Executive Oversight", filename: "/team/mohsin-nawaz.jpeg", initials: "MN", accent: "#eab308", tagline: "Guiding executive alignment, organizational governance, and strategic growth.", bio: "Mohsin brings veteran executive leadership, guiding organizational roadmaps, ecosystem partnerships, and talent acceleration.", skills: ["Executive Leadership", "Governance", "Strategic Advisory"], quote: "True leadership builds foundations where the next generation stands taller." },
  { id: "muhammad", name: "Muhammad Zahid", role: "Graphics Lead/Trainer", badge: "Web3 & 3D Web", filename: "/team/muhammad-zahid.jpeg", initials: "MZ", accent: "#06b6d4", tagline: "Pushing frontiers in interactive 3D WebGL, CSS engines, and fluid animations.", bio: "Muhammad specializes in high-performance frontend engineering, interactive 3D graphics, and responsive web animations.", skills: ["Three.js & WebGL", "CSS 3D Engines", "Performance Tuning"], quote: "The browser is an infinite canvas; 3D perspective is simply another dimension to explore." }
];

export function Team3DShowcase() {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrubberFillRef = useRef<HTMLDivElement>(null);
  const wrappersRef = useRef<(HTMLDivElement | null)[]>([]);
  const chipsRef = useRef<(HTMLDivElement | null)[]>([]);

  const [direction, setDirection] = useState<1 | -1>(1);
  const [style, setStyle] = useState("amphitheater");
  const [modalData, setModalData] = useState<typeof teamData[0] | null>(null);
  const [isTouring, setIsTouring] = useState(false);
  const tourTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Animation Loop state (using refs for performance)
  const animState = useRef({
    currentP: 0,
    targetP: 0
  });

  useEffect(() => {
    let reqId: number;
    const loop = () => {
      if (!outerRef.current || !trackRef.current || !scrubberFillRef.current) {
        reqId = requestAnimationFrame(loop);
        return;
      }

      const rect = outerRef.current.getBoundingClientRect();
      const total = outerRef.current.offsetHeight - window.innerHeight;
      
      // Calculate target scroll percentage
      animState.current.targetP = Math.max(0, Math.min(1, -rect.top / total));
      // Linear interpolation for smoothness
      animState.current.currentP += (animState.current.targetP - animState.current.currentP) * 0.12;

      const currentP = animState.current.currentP;

      // Update Scrubber
      scrubberFillRef.current.style.width = `${(currentP * 100).toFixed(1)}%`;

      // Update Active Chip
      const activeIdx = Math.min(teamData.length - 1, Math.round(currentP * (teamData.length - 1)));
      chipsRef.current.forEach((c, i) => {
        if (c) {
          if (i === activeIdx) c.classList.add("active");
          else c.classList.remove("active");
        }
      });

      // Calculate Track translation
      const screenW = window.innerWidth;
      const firstCard = trackRef.current.firstElementChild as HTMLElement;
      const lastCard = trackRef.current.lastElementChild as HTMLElement;

      let startTx = 0;
      let endTx = 0;
      if (firstCard && lastCard) {
        startTx = screenW / 2 - (firstCard.offsetLeft + firstCard.offsetWidth / 2);
        endTx = screenW / 2 - (lastCard.offsetLeft + lastCard.offsetWidth / 2);
      }
      const travel = startTx - endTx;

      let tx = 0;
      if (direction === 1) {
        tx = startTx - (currentP * travel);
      } else {
        tx = endTx + (currentP * travel);
      }
      trackRef.current.style.transform = `translate3d(${tx}px, 0, 0)`;

      // Calculate 3D Parabolic Card Transforms
      const screenMid = screenW / 2;
      wrappersRef.current.forEach(w => {
        if (!w) return;
        const b = w.getBoundingClientRect();
        const mid = b.left + b.width / 2;
        const dist = (mid - screenMid) / (screenW * 0.45);
        const absD = Math.abs(dist);

        let ry = 0, rx = 0, tz = 0, sc = 1, op = 1;

        if (style === 'amphitheater') {
          ry = dist * -25;
          rx = absD * 5;
          tz = (1 - Math.min(1, absD)) * 140 - (absD * 80);
          sc = 1.05 - (absD * 0.12);
          op = Math.max(0.35, 1 - (absD * 0.28));
        } else if (style === 'cylinder') {
          const ang = dist * 0.55;
          ry = -ang * (180 / Math.PI);
          tz = Math.cos(ang) * 160 - 160;
          sc = 1.06 - (absD * 0.14);
          op = Math.max(0.3, 1 - (absD * 0.3));
        } else {
          sc = Math.max(0.85, 1.15 - (absD * 0.35));
          tz = (1 - Math.min(1, absD)) * 180;
          op = Math.max(0.25, 1 - (absD * 0.45));
          ry = dist * -8;
        }

        w.style.transform = `perspective(1400px) translateZ(${tz.toFixed(1)}px) rotateY(${ry.toFixed(1)}deg) rotateX(${rx.toFixed(1)}deg) scale(${Math.max(0.7, sc).toFixed(3)})`;
        w.style.opacity = op.toFixed(2);
      });

      reqId = requestAnimationFrame(loop);
    };

    reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqId);
  }, [direction, style]);

  const toggleDirection = () => {
    setDirection(prev => prev === 1 ? -1 : 1);
  };

  const jumpToMember = (idx: number) => {
    if (!outerRef.current) return;
    const rect = outerRef.current.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const scrollable = outerRef.current.offsetHeight - window.innerHeight;
    const target = top + (idx / (teamData.length - 1)) * scrollable;
    window.scrollTo({ top: target, behavior: 'smooth' });
  };

  const toggleTour = () => {
    if (isTouring) {
      setIsTouring(false);
      if (tourTimerRef.current) clearInterval(tourTimerRef.current);
    } else {
      setIsTouring(true);
      if (!outerRef.current) return;
      const startTop = window.scrollY + outerRef.current.getBoundingClientRect().top;
      const total = outerRef.current.offsetHeight - window.innerHeight;
      tourTimerRef.current = setInterval(() => {
        if (window.scrollY >= startTop + total - 10) {
          window.scrollTo({ top: startTop, behavior: 'smooth' });
        } else {
          window.scrollBy({ top: 4, behavior: 'auto' });
        }
      }, 16);
    }
  };

  useEffect(() => {
    return () => {
      if (tourTimerRef.current) clearInterval(tourTimerRef.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, cardInner: HTMLDivElement | null) => {
    if (!cardInner) return;
    const rect = cardInner.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    cardInner.style.transform = `rotateX(${-y * 12}deg) rotateY(${x * 12}deg) translateZ(20px)`;
  };
  const handleMouseLeave = (cardInner: HTMLDivElement | null) => {
    if (!cardInner) return;
    cardInner.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
  };

  return (
    <div className="t3d-wrapper">
      <section className="t3d-hero">
        <div className="t3d-scroll-hint" onClick={() => window.scrollTo({ top: window.scrollY + window.innerHeight * 0.85, behavior: 'smooth' })}>
          <span>Scroll Down to Trigger 3D Showcase</span>
          <span>▼</span>
        </div>
      </section>

      <div className="t3d-scroll-outer" ref={outerRef}>
        <div className="t3d-scroll-sticky">
          
          <div className="t3d-hud">
            <div className="t3d-hud-left">
              <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>Leadership Track</span>
              <h2>Executive & Engineering Team</h2>
            </div>

          </div>

          <div className="t3d-viewport">
            <div className="t3d-track" ref={trackRef}>
              {teamData.map((m, idx) => (
                <div 
                  key={m.id} 
                  className="t3d-card-wrap" 
                  ref={el => { wrappersRef.current[idx] = el; }}
                  onClick={() => setModalData(m)}
                >
                  <div 
                    className="t3d-card" 
                    style={{ '--glow': `${m.accent}44` } as any}
                    onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
                    onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
                  >
                    <div className="t3d-card-img-box">
                      <span className="t3d-card-idx">0{idx + 1}</span>
                      <span className="t3d-card-badge" style={{ borderColor: m.accent }}>{m.badge}</span>
                      <img className="t3d-card-img" src={m.filename} alt={m.name} />
                      <div className="t3d-card-gradient"></div>
                    </div>
                    <div className="t3d-card-content">
                      <div>
                        <div className="t3d-card-name">{m.name}</div>
                        <div className="t3d-card-role"><span style={{ width: 6, height: 6, borderRadius: '50%', background: m.accent, display: 'inline-block' }}></span> {m.role}</div>
                        <p className="t3d-card-desc">{m.tagline}</p>
                      </div>
                      <div className="t3d-card-footer">
                        <div className="t3d-card-tags">
                          {m.skills.slice(0, 2).map(s => <span key={s} className="t3d-tag">{s}</span>)}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700 }}>Details →</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="t3d-timeline">
            <div className="t3d-scrubber">
              <div className="t3d-fill" ref={scrubberFillRef}></div>
            </div>
            <div className="t3d-nav">
              {teamData.map((m, idx) => (
                <div 
                  key={m.id} 
                  className="t3d-chip"
                  ref={el => { chipsRef.current[idx] = el; }}
                  onClick={() => jumpToMember(idx)}
                >
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: m.accent, display: 'inline-block' }}></span>
                  {m.name.split(' ')[0]}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Detail Modal */}
      <div className={`t3d-modal-backdrop ${modalData ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setModalData(null); }}>
        {modalData && (
          <div className="t3d-modal-box">
            <div className="t3d-modal-left">
              <div className="t3d-modal-img-wrap">
                <img src={modalData.filename} alt={modalData.name} />
              </div>
              <div className="t3d-tag" style={{ marginBottom: '0.5rem', background: 'rgba(99, 102, 241, 0.2)', color: '#fff', fontWeight: 700 }}>
                {modalData.badge}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                ID: DEVQ-{modalData.id.toUpperCase()}
              </div>
            </div>
            <div className="t3d-modal-right">
              <button className="t3d-close-btn" onClick={() => setModalData(null)}>&times;</button>
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>{modalData.name}</h2>
                <div style={{ fontSize: '0.88rem', color: '#a5b4fc', fontWeight: 600, marginTop: '0.2rem' }}>{modalData.role}</div>
                <div className="t3d-modal-quote">“{modalData.quote}”</div>
                <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6, marginTop: '0.8rem' }}>{modalData.bio}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  {modalData.skills.map(s => (
                    <span key={s} className="t3d-tag" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '0.3rem 0.6rem' }}>{s}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                <button className="t3d-btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => alert('Connect request coming soon!')}>Connect</button>
                <button className="t3d-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }}>Share</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
