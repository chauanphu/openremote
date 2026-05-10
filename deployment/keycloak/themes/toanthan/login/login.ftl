<#import "template.ftl" as layout>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SCADA CGP – Hệ thống quản lý</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${url.resourcesPath}/css/login.css" />
</head>
<body>

<div class="page-wrapper">

  <!-- Left decorative panel -->
  <div class="hero-panel" aria-hidden="true">

    <!-- Background SVG decorations -->
    <svg class="deco deco-radar" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
      <circle cx="300" cy="300" r="80"  fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
      <circle cx="300" cy="300" r="150" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      <circle cx="300" cy="300" r="230" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      <circle cx="300" cy="300" r="310" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      <circle cx="300" cy="300" r="400" fill="none" stroke="rgba(255,255,255,0.025)" stroke-width="1"/>
      <circle cx="300" cy="300" r="500" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>
    </svg>

    <svg class="deco deco-spotlight-left" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
      <polygon points="0,0 160,600 0,600" fill="rgba(30,95,191,0.08)"/>
      <polygon points="0,0 120,600 0,600" fill="rgba(30,95,191,0.06)"/>
    </svg>

    <svg class="deco deco-spotlight-right" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
      <polygon points="400,0 240,600 400,600" fill="rgba(30,95,191,0.08)"/>
      <polygon points="400,0 280,600 400,600" fill="rgba(30,95,191,0.06)"/>
    </svg>

    <svg class="deco deco-grid" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="500" height="500" fill="url(#grid)"/>
    </svg>

    <!-- Satellite dish -->
    <svg class="deco deco-dish" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="80" cy="130" rx="70" ry="28" fill="none" stroke="rgba(100,160,255,0.25)" stroke-width="1.5"/>
      <ellipse cx="80" cy="130" rx="50" ry="18" fill="none" stroke="rgba(100,160,255,0.18)" stroke-width="1"/>
      <ellipse cx="80" cy="130" rx="30" ry="10" fill="none" stroke="rgba(100,160,255,0.14)" stroke-width="1"/>
      <line x1="80" y1="130" x2="80" y2="185" stroke="rgba(100,160,255,0.3)" stroke-width="2"/>
      <line x1="55" y1="185" x2="105" y2="185" stroke="rgba(100,160,255,0.3)" stroke-width="2"/>
      <line x1="140" y1="75" x2="80" y2="130" stroke="rgba(100,160,255,0.4)" stroke-width="1.5" stroke-dasharray="4,3"/>
      <circle cx="143" cy="72" r="5" fill="rgba(100,160,255,0.5)"/>
      <circle cx="143" cy="72" r="10" fill="none" stroke="rgba(100,160,255,0.25)" stroke-width="1"/>
    </svg>

    <!-- Constellation dots -->
    <svg class="deco deco-stars" viewBox="0 0 700 500" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80"  cy="80"  r="1.5" fill="rgba(255,255,255,0.5)"/>
      <circle cx="200" cy="50"  r="1"   fill="rgba(255,255,255,0.4)"/>
      <circle cx="350" cy="120" r="2"   fill="rgba(255,255,255,0.6)"/>
      <circle cx="500" cy="60"  r="1.5" fill="rgba(255,255,255,0.35)"/>
      <circle cx="620" cy="130" r="1"   fill="rgba(255,255,255,0.4)"/>
      <circle cx="150" cy="250" r="1.5" fill="rgba(255,255,255,0.3)"/>
      <circle cx="440" cy="310" r="2"   fill="rgba(255,255,255,0.45)"/>
      <circle cx="580" cy="270" r="1"   fill="rgba(255,255,255,0.35)"/>
      <circle cx="90"  cy="400" r="1.5" fill="rgba(255,255,255,0.25)"/>
      <circle cx="310" cy="420" r="1"   fill="rgba(255,255,255,0.3)"/>
      <line x1="80"  y1="80"  x2="200" y2="50"  stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
      <line x1="200" y1="50"  x2="350" y2="120" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
      <line x1="350" y1="120" x2="500" y2="60"  stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
      <line x1="500" y1="60"  x2="620" y2="130" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
      <line x1="150" y1="250" x2="440" y2="310" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
      <line x1="440" y1="310" x2="580" y2="270" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
    </svg>

    <!-- Branding -->
    <div class="hero-brand">
      <div class="brand-logo-mark" aria-label="SCADA CGP logo">
        <!-- You can replace logo.png in the resources/img folder with your real logo later -->
        <img src="${url.resourcesPath}/img/logo.png" alt="SCADA CGP Logo" style="width: 100%; height: auto; object-fit: contain;" />
      </div>
      <div class="brand-text">
        <div class="brand-name">SCADA CGP</div>
        <div class="brand-sub">GIẢI PHÁP CHIẾU SÁNG & NĂNG LƯỢNG THÔNG MINH</div>
      </div>
    </div>  

  </div><!-- /hero-panel -->

  <!-- Right login card -->
  <div class="card-panel">
    <div class="login-card">

      <div class="card-header">
        <div class="card-label">Truy cập hệ thống</div>
        <h1 class="card-title">Đăng nhập tài khoản</h1>
      </div>

      <#if message?has_content>
        <div class="alert alert-${message.type}" role="alert">
          ${message.summary?no_esc}
        </div>
      </#if>

      <form id="kc-form-login" class="login-form" action="${url.loginAction}" method="post">

        <div class="form-group">
          <label class="form-label" for="username">Tài khoản</label>
          <input
            id="username"
            class="form-input"
            name="username"
            type="text"
            value="${(login.username)!''}"
            autocomplete="username"
            autocapitalize="off"
            spellcheck="false"
            autofocus
            placeholder="Nhập tên tài khoản"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Mật khẩu</label>
          <input
            id="password"
            class="form-input"
            name="password"
            type="password"
            autocomplete="current-password"
            placeholder="Nhập mật khẩu"
          />
        </div>

        <#if usernameEditDisabled??>
          <input type="hidden" id="username" name="username" value="${login.username}" />
        </#if>

        <input type="hidden" id="id-hidden-input" name="credentialId"
          <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>

        <button class="btn-login" type="submit" name="login">
          Đăng nhập &nbsp;&rarr;
        </button>

      </form>

      <div class="status-bar">
        <span class="status-node">NODE &middot; HCM-01</span>
        <span class="status-online">
          <span class="status-dot"></span>ONLINE
        </span>
      </div>

    </div><!-- /login-card -->
  </div><!-- /card-panel -->

</div><!-- /page-wrapper -->

</body>
</html>
