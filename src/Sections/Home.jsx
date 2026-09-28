import React, { useEffect, useMemo, useState, useRef } from "react";
import profileImage from "../assets/Profile.png";

const Vaibhav = () => (
  <span className="text-amber-300">Vaibhav</span>
);

const Home = () => {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [activeCells, setActiveCells] = useState([]);
  const [phase, setPhase] = useState("filling");
  const [idx, setIdx] = useState(0);
  const [startUp, setStartUp] = useState(true);
  const [digitTick, setDigitTick] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [swappedCells, setSwappedCells] = useState(() => new Set());

  const orderRef = useRef([]);
  const heroRef = useRef(null);
  const [isHeroVisible, setIsHeroVisible] = useState(true);

  const messages = [
    "WEB DEVELOPER",
    "UX DESIGNER"
  ];

  useEffect(() => {
    const hero = heroRef.current;
    const nextSection = hero?.nextElementSibling;
    if (!hero || !nextSection) return;

    let isHeroInView = false;
    let isNextSectionInView = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === hero) {
            isHeroInView = entry.isIntersecting && entry.intersectionRatio >= 0.25;
          } else if (entry.target === nextSection) {
            isNextSectionInView = entry.isIntersecting;
          }
        });

        setIsHeroVisible(isHeroInView && !isNextSectionInView);
      },
      { threshold: [0, 0.25] }
    );

    observer.observe(hero);
    observer.observe(nextSection);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const grid = useMemo(() => {
    const size = viewport.width <= 640 ? 40 : 60;
    const columns = Math.max(1, Math.ceil(viewport.width / size));
    const rows = Math.max(1, Math.ceil(viewport.height / size));

    return {
      size,
      columns,
      rows,
      cells: columns * rows,
    };
  }, [viewport]);

  useEffect(() => {
    if (grid.rows === 0 || grid.columns === 0) return;

    const order = [];
    for (let c = 0; c < grid.columns; c++) {
      const goingUp = c % 2 === 0 ? startUp : !startUp;

      if (goingUp) {
        for (let r = grid.rows - 1; r >= 0; r--) {
          order.push(r * grid.columns + c);
        }
      } else {
        for (let r = 0; r < grid.rows; r++) {
          order.push(r * grid.columns + c);
        }
      }
    }
    orderRef.current = order;

    setActiveCells([]);
    setIdx(0);
    setPhase("filling");
    setSwappedCells(new Set());
  }, [grid, startUp]);

  const textRow = Math.min(12, grid.rows - 2);
  const isTextCell = (cell) => {
    if (grid.columns === 0) return false;
    const row = Math.floor(cell / grid.columns);
    const col = cell % grid.columns;
    if (row !== textRow) return false;

    const startColA = messageIndex === 0 ? 12 : 13;
    const startColB = messageIndex === 0 ? 13 : 12;
    const lenA = messages[messageIndex].length;
    const lenB = messages[(messageIndex + 1) % 2].length;

    const inA = col >= startColA && col < startColA + lenA + 2;
    const inB = col >= startColB && col < startColB + lenB + 2;
    return inA || inB;
  };

  useEffect(() => {
    const SPEED = 14;

    const interval = setInterval(() => {
      if (phase === "filling") {
        if (idx < orderRef.current.length) {
          const nextCell = orderRef.current[idx];
          setActiveCells((prev) => [...prev, nextCell]);
          setIdx((prev) => prev + 1);
        } else {
          setPhase("erasing");
          setIdx(0);
          setSwappedCells(new Set());
        }
      } else if (phase === "erasing") {
        if (idx < orderRef.current.length) {
          const cell = orderRef.current[idx];

          if (isTextCell(cell)) {
            setSwappedCells((prev) => {
              const next = new Set(prev);
              next.add(cell);
              return next;
            });
          } else {
            setActiveCells((prev) => prev.filter((c) => c !== cell));
          }
          setIdx((prev) => prev + 1);
        } else {
          setMessageIndex((prev) => (prev + 1) % 2);
          setStartUp((prev) => !prev);
          setActiveCells((prev) => prev.filter((c) => isTextCell(c)));
          setIdx(0);
          setPhase("filling");
          setSwappedCells(new Set());
        }
      }
    }, SPEED);

    return () => clearInterval(interval);
  }, [phase, idx, grid, messageIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDigitTick((prev) => prev + 1);
    }, 950);

    return () => clearInterval(interval);
  }, []);

  const currentMessage = messages[messageIndex];
  const nextMessage = messages[(messageIndex + 1) % 2];

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative flex min-h-[calc(100vh-2rem)] w-full items-center justify-center overflow-hidden px-4"
    >
      {/* Viewport-wide animated background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        {activeCells.map((cell, index) => {
          const row = Math.floor(cell / grid.columns);
          const col = cell % grid.columns;
          if (row === 0) return null;

          let char = "";
          let isSpecialText = false;

          const isSwapped = phase === "erasing" && swappedCells.has(cell);
          const activeMessage = isSwapped ? nextMessage : currentMessage;
          const startCol = isSwapped
            ? (messageIndex === 0 ? 13 : 12)
            : (messageIndex === 0 ? 12 : 13);

          const isTextPosition = isHeroVisible && row === textRow &&
                                col >= startCol &&
                                col < startCol + activeMessage.length + 2;

          if (isTextPosition) {
            const msgIndex = col - startCol;
            const letterAtPos = activeMessage[msgIndex];
            if (letterAtPos && letterAtPos !== " ") {
              char = letterAtPos;
              isSpecialText = true;
            } else {
              const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
              const letterIndex = (digitTick + index * 3) % letters.length;
              char = letters[letterIndex];
            }
          } else {
            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const letterIndex = (digitTick + index * 3) % letters.length;
            char = letters[letterIndex];
          }

          return (
            <span
              key={`${cell}-${index}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 font-mono text-xl select-none ${
                isSpecialText
                  ? "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] font-semibold"
                  : "text-amber-300/8"
              }`}
              style={{
                top: `${row * grid.size + grid.size / 2}px`,
                left: `${col * grid.size + grid.size / 2}px`,
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* Text Section */}
      <div className="relative z-10 mt-10 w-full text-center lg:w-1/2 lg:text-left">
        <p className="mb-4 text-sm uppercase tracking-[0.35em] text-amber-300">
          Welcome
        </p>

        <h1 className="mb-6 text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl lg:text-6xl">
          Hi, I'm <Vaibhav />.
          <br />
          I build polished digital experiences.
        </h1>

        <p className="text-lg leading-8 text-slate-300 sm:text-xl">
          I'm a developer focused on modern, elegant and user-friendly web
          interfaces.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          {/* View Projects — dark */}
              {/* Contact Me — gold */}
          <a href="#contact" style={{
            padding: '0.7rem 1.6rem', borderRadius: 8, fontSize: '0.88rem', fontWeight: 500,
            background: '#f2d322', color: '#17130a',
            border: '1px solid #c9a84c', textDecoration: 'none',
            letterSpacing: '0.04em', transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fbbb0b'; e.currentTarget.style.borderColor = '#dfbd62'; e.currentTarget.style.boxShadow = '0 0 18px rgba(201,168,76,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f3b611'; e.currentTarget.style.borderColor = '#c9a84c'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <b>Contact Me</b>
          </a>
          <a href="#projects" style={{
            padding: '0.7rem 1.6rem', borderRadius: 8, fontSize: '0.88rem', fontWeight: 500,
            background: 'rgba(255,255,255,0.06)', color: '#f0ede6',
            border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none',
            letterSpacing: '0.04em', transition: 'background 0.2s, border-color 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          >
            View Projects
          </a>

      
        </div>
      </div>

      {/* Image Section */}
      <div className="relative z-10 mt-8 flex w-full flex-shrink-0 items-center justify-center lg:mt-0 lg:w-[40%]">
        <div
          className="absolute inset-0 m-auto h-[75%] w-[75%] rounded-full blur-[100px] opacity-30 -z-10"
          style={{
            background:
              "radial-gradient(circle, rgba(252,211,77,0.4) 0%, transparent 70%)",
          }}
        />

        <div className="absolute bottom-[7%] left-1/2 h-10 w-[62%] -translate-x-[20%] rounded-[50%] bg-black/55 blur-xl -z-10" />

        <img
          src={profileImage}
          alt="Vaibhav"
          className="relative z-0 h-auto w-[20rem] max-w-[28rem] object-contain object-center sm:w-[26rem] lg:w-full"
          style={{
            maskImage:
              "radial-gradient(ellipse 65% 80% at 50% 45%, black 65%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 65% 80% at 50% 45%, black 65%, transparent 100%)",
            filter:
              "drop-shadow(18px 28px 30px rgba(0,0,0,0.58)) drop-shadow(-5px 0 16px rgba(252,211,77,0.12)) brightness(0.97) contrast(1.03)",
            transform: "translate(45px, -50px)",
          }}
        />
      </div>
    </section>
  );
};

export default Home;