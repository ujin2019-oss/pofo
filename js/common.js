/* =============================================================
   common.js
   - 모든 페이지에서 공통으로 동작하는 스크립트
   - (1) 헤더/푸터 컴포넌트 불러오기(include)
   - (2) 모바일 메뉴 토글
   - (3) 헤더 스크롤 효과
   ============================================================= */

/* JS가 동작하면 <html> 에서 no-js 클래스를 제거 (CSS 대비용) */
document.documentElement.classList.remove("no-js");

/* -----------------------------------------------------------
   (1) 컴포넌트 include
   - data-include="경로" 가 있는 요소에 해당 HTML 파일 내용을 넣습니다.
   - 헤더/푸터를 한 곳에서 관리하기 위함입니다.
   - fetch 를 사용하므로 로컬에서 열 때는 반드시 "서버"로 실행하세요.
     (카페24 등 실제 서버에 올리면 자동으로 정상 동작합니다.)
   - 모든 include 가 끝나면 "components:loaded" 이벤트를 발생시킵니다.
   ----------------------------------------------------------- */
async function includeComponents() {
  const targets = document.querySelectorAll("[data-include]");

  const tasks = Array.from(targets).map(async (el) => {
    const url = el.getAttribute("data-include");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url} 불러오기 실패 (${res.status})`);
      el.innerHTML = await res.text();
    } catch (err) {
      console.error("[include] 컴포넌트 로드 오류:", err);
    }
  });

  await Promise.all(tasks);

  // 헤더/푸터가 DOM에 들어온 뒤 초기화
  initHeader();

  // 다른 스크립트(main.js)에 "이제 헤더/푸터 준비됨"을 알림
  document.dispatchEvent(new CustomEvent("components:loaded"));
}

/* -----------------------------------------------------------
   (2) + (3) 헤더 초기화 (모바일 메뉴 + 스크롤 효과)
   ----------------------------------------------------------- */
function initHeader() {
  const header = document.getElementById("header");
  const toggle = document.getElementById("headerToggle");
  if (!header) return;

  /* 모바일 햄버거 메뉴 열고 닫기 */
  if (toggle) {
    toggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
    });

    /* 메뉴 항목 클릭 시 자동으로 닫기 */
    header.querySelectorAll(".header__link").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* 스크롤 시 헤더 배경 진하게 (성능을 위해 rAF 사용) */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (window.scrollY > 10) {
        header.style.backgroundColor = "rgba(255,255,255,0.92)";
      } else {
        header.style.backgroundColor = "rgba(255,255,255,0.7)";
      }
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* 페이지 로드 시 컴포넌트 불러오기 시작 */
document.addEventListener("DOMContentLoaded", includeComponents);
