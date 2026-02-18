import { useState, useEffect, useCallback, useRef } from 'react';

const TOUR_STEPS = [
  {
    id: 'daily-list',
    target: '[data-tour="daily-list"]',
    text: 'هنا تسجّل يومك في أقل من دقيقة ✅',
    placement: 'bottom',
  },
  {
    id: 'habit-toggle',
    target: '[data-tour="habit-toggle-prayer"]',
    text: 'اضغط الدائرة لتعليم الإنجاز — جرّب الآن',
    placement: 'bottom',
    requiresAction: true,
  },
  {
    id: 'habit-expand',
    target: '[data-tour="habit-expand-prayer"]',
    text: 'لو تبغى تفاصيل، افتح التوسعة (مثلاً الصلوات الخمس)',
    placement: 'bottom',
    onEnter: 'expandPrayer',
  },
  {
    id: 'submit-button',
    target: '[data-tour="submit-button"]',
    text: 'بعد ما تخلص، اضغط (تأكيد الإنجاز) ليُحسب اليوم 🔥',
    placement: 'top',
  },
  {
    id: 'nav-reports',
    target: '[data-tour="nav-reports"]',
    text: 'التقارير تعرض تقدمك خلال رمضان',
    placement: 'top',
  },
];

const TOUR_DONE_KEY = 'rr_tour_done';

export function isTourDone() {
  try { return localStorage.getItem(TOUR_DONE_KEY) === '1'; } catch { return false; }
}

export function resetTour() {
  try { localStorage.removeItem(TOUR_DONE_KEY); } catch { /* */ }
}

function markTourDone() {
  try { localStorage.setItem(TOUR_DONE_KEY, '1'); } catch { /* */ }
}

export default function GuidedTour({ active, onClose, onExpandPrayer }) {
  const [step, setStep] = useState(0);
  // spotlight stores viewport-relative rect (since overlay is position:fixed)
  const [spotlight, setSpotlight] = useState(null);
  const actionListenerRef = useRef(null);

  const currentStep = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  // Position the spotlight on the target element (viewport-relative)
  const positionSpotlight = useCallback(() => {
    if (!active || !currentStep) return;
    const el = document.querySelector(currentStep.target);
    if (!el) return;

    // Scroll element into view first
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Use a rAF to ensure scroll finishes and layout is settled
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const pad = 6;
      setSpotlight({
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      });
    });
  }, [active, currentStep]);

  // Re-position on step change, resize, scroll
  useEffect(() => {
    if (!active) return;
    // Small delay to allow DOM to settle
    const timer = setTimeout(positionSpotlight, 200);
    window.addEventListener('resize', positionSpotlight);
    window.addEventListener('scroll', positionSpotlight, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', positionSpotlight);
      window.removeEventListener('scroll', positionSpotlight, true);
    };
  }, [active, step, positionSpotlight]);

  // onEnter actions
  useEffect(() => {
    if (!active || !currentStep?.onEnter) return;
    if (currentStep.onEnter === 'expandPrayer') {
      onExpandPrayer?.();
      // Reposition after expand animation completes
      const t = setTimeout(positionSpotlight, 400);
      return () => clearTimeout(t);
    }
  }, [active, step, currentStep, onExpandPrayer, positionSpotlight]);

  // requiresAction — listen for click on target element
  useEffect(() => {
    if (!active || !currentStep?.requiresAction) return;

    // Clean up previous listener
    if (actionListenerRef.current) {
      actionListenerRef.current();
      actionListenerRef.current = null;
    }

    const el = document.querySelector(currentStep.target);
    if (!el) return;

    function handleAction() {
      setTimeout(() => setStep((s) => s + 1), 400);
    }

    el.addEventListener('click', handleAction, { once: true });
    actionListenerRef.current = () => el.removeEventListener('click', handleAction);

    return () => {
      if (actionListenerRef.current) {
        actionListenerRef.current();
        actionListenerRef.current = null;
      }
    };
  }, [active, step, currentStep]);

  function next() {
    if (isLast) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }

  function skip() {
    finish();
  }

  function finish() {
    markTourDone();
    setStep(0);
    setSpotlight(null);
    onClose();
  }

  // Handle overlay click — allow clicks on the highlighted target for requiresAction steps
  function handleOverlayClick(e) {
    if (!currentStep) return;
    const el = document.querySelector(currentStep.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      if (currentStep.requiresAction) {
        el.click();
      }
    }
    // Otherwise, overlay absorbs the click
  }

  if (!active || !currentStep) return null;

  // Viewport dimensions
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Calculate tooltip position (viewport-relative, since overlay is fixed)
  let tooltipStyle = {};
  if (spotlight) {
    const tooltipW = Math.min(280, vw - 32);
    const centerX = spotlight.left + spotlight.width / 2 - tooltipW / 2;
    const clampedX = Math.max(16, Math.min(centerX, vw - tooltipW - 16));

    if (currentStep.placement === 'top') {
      tooltipStyle = {
        bottom: vh - spotlight.top + 12,
        left: clampedX,
        width: tooltipW,
      };
    } else {
      tooltipStyle = {
        top: spotlight.top + spotlight.height + 12,
        left: clampedX,
        width: tooltipW,
      };
    }
  }

  return (
    <div className="tour-overlay" onClick={handleOverlayClick}>
      {/* SVG overlay with cutout hole for spotlight */}
      <svg className="tour-svg" width={vw} height={vh}>
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width={vw} height={vh} fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0"
          width={vw} height={vh}
          fill="rgba(0,0,0,0.65)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Spotlight ring highlight */}
      {spotlight && (
        <div
          className="tour-spotlight-ring"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}

      {/* Tooltip */}
      {spotlight && (
        <div className="tour-tooltip" style={tooltipStyle}>
          <p className="tour-text">{currentStep.text}</p>
          <div className="tour-actions">
            {step === 0 && (
              <button className="tour-btn tour-btn-skip" onClick={(e) => { e.stopPropagation(); skip(); }}>
                تخطي
              </button>
            )}
            {!currentStep.requiresAction && (
              <button className="tour-btn tour-btn-next" onClick={(e) => { e.stopPropagation(); next(); }}>
                {isLast ? 'تم' : 'التالي'}
              </button>
            )}
          </div>
          {/* Step indicator dots */}
          <div className="tour-dots">
            {TOUR_STEPS.map((_, i) => (
              <span key={i} className={`tour-dot${i === step ? ' active' : ''}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
