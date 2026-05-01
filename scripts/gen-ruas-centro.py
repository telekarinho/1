#!/usr/bin/env python3
"""
Gera páginas SEO hiperlocal para ruas e micro-bairros num raio de 3km
da loja MilkyPot na Rua Quintino Bocaiúva, Centro Londrina.
"""
import os, textwrap

# ── Base dir ──
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── Ruas e Micro-bairros até 3km da Quintino Bocaiúva ──
# Cada entrada: (slug, nome, tipo, referências, tempo_entrega)
LOCAIS = [
    # === RUAS PRINCIPAIS DO CENTRO ===
    ("rua-quintino-bocaiuva", "Rua Quintino Bocaiúva", "rua",
     ["Shopping Quintino", "Super Muffato Quintino", "centro comercial da Quintino"],
     "5-10 min"),
    ("avenida-parana", "Avenida Paraná", "rua",
     ["Calçadão de Londrina", "comércio do Calçadão", "coração do centro"],
     "5-10 min"),
    ("avenida-higienopolis", "Avenida Higienópolis", "rua",
     ["Boulevard Londrina Shopping", "clínicas da Higienópolis", "região gastronômica"],
     "5-15 min"),
    ("rua-sergipe", "Rua Sergipe", "rua",
     ["Praça Rocha Pombo", "edifícios residenciais", "comércio variado"],
     "5-10 min"),
    ("rua-fernando-de-noronha", "Rua Fernando de Noronha", "rua",
     ["Hospital Universitário", "clínicas médicas", "zona hospitalar"],
     "5-15 min"),
    ("rua-benjamin-constant", "Rua Benjamin Constant", "rua",
     ["cartórios do centro", "escritórios", "prédios comerciais"],
     "5-10 min"),
    ("rua-goias", "Rua Goiás", "rua",
     ["órgãos públicos", "INSS Londrina", "Receita Federal"],
     "5-10 min"),
    ("rua-para", "Rua Pará", "rua",
     ["Rodoviária de Londrina", "Terminal urbano", "comércio popular"],
     "5-15 min"),
    ("rua-maranhao", "Rua Maranhão", "rua",
     ["zona escolar", "Instituto de Educação", "comércio do centro"],
     "5-10 min"),
    ("rua-minas-gerais", "Rua Minas Gerais", "rua",
     ["final do Calçadão", "Praça Gabriel Martins", "bares e restaurantes"],
     "5-10 min"),
    ("rua-prefeito-hugo-cabral", "Rua Prefeito Hugo Cabral", "rua",
     ["início do Calçadão", "câmbios", "lojas de eletrônicos"],
     "5-10 min"),
    ("avenida-rio-branco", "Avenida Rio Branco", "rua",
     ["Prefeitura de Londrina", "prédios governamentais", "zona institucional"],
     "5-15 min"),
    ("avenida-duque-de-caxias", "Avenida Duque de Caxias", "rua",
     ["Colégio Marista", "clínicas", "acesso à zona sul"],
     "10-15 min"),
    ("rua-santos-dumont", "Rua Santos Dumont", "rua",
     ["comércio de rua", "lojas de tecidos", "centro comercial"],
     "5-10 min"),
    ("avenida-jk", "Avenida Juscelino Kubitschek", "rua",
     ["via de acesso rápido", "conexão entre bairros", "escritórios modernos"],
     "10-15 min"),
    ("rua-piauí", "Rua Piauí", "rua",
     ["região residencial", "arredores da Catedral", "supermercados"],
     "5-10 min"),
    ("avenida-arcebispo-dom-geraldo", "Avenida Arcebispo Dom Geraldo Fernandes", "rua",
     ["Catedral Metropolitana", "Praça Willie Davids", "cartão postal de Londrina"],
     "5-15 min"),

    # === MICRO-BAIRROS ATÉ 3KM ===
    ("jardim-higienopolis", "Jardim Higienópolis", "bairro",
     ["Boulevard Shopping", "Av. Higienópolis", "região de clínicas e gastronomia"],
     "10-15 min"),
    ("vila-casoni", "Vila Casoni", "bairro",
     ["Zerão (Parque Ney Braga)", "UEL Câmpus Sede", "praças arborizadas"],
     "10-20 min"),
    ("vila-nova", "Vila Nova", "bairro",
     ["proximidade à rodoviária", "comércio popular", "feiras de rua"],
     "10-15 min"),
    ("jardim-petropolis", "Jardim Petrópolis", "bairro",
     ["Museu Histórico de Londrina", "Museu de Arte de Londrina", "Bosque central"],
     "10-20 min"),
    ("vila-ipiranga", "Vila Ipiranga", "bairro",
     ["Mercado Municipal", "zona comercial tradicional", "armazéns"],
     "10-20 min"),
    ("vila-recreio", "Vila Recreio", "bairro",
     ["SESC Londrina", "área de lazer", "praças esportivas"],
     "10-20 min"),
    ("jardim-claudia", "Jardim Cláudia", "bairro",
     ["residências", "padarias tradicionais", "acesso à zona norte"],
     "15-25 min"),
    ("jardim-antares", "Jardim Antares", "bairro",
     ["região leste", "supermercados Condor", "comércio de bairro"],
     "15-25 min"),
]


def gerar_pagina_rua(slug, nome, tipo, refs, tempo):
    """Gera HTML para uma rua ou micro-bairro."""
    tipo_label = "rua" if tipo == "rua" else "bairro"
    tipo_badge = "📍 Rua" if tipo == "rua" else "🏘️ Bairro"
    prep = "na" if tipo == "rua" else "no" if nome.startswith(("Jardim", "Vila")) == False else "no"
    if nome.startswith("Rua") or nome.startswith("Avenida"):
        prep = "na"
    elif nome.startswith("Jardim") or nome.startswith("Vila"):
        prep = "no" if nome.startswith("Vila") else "no"
    else:
        prep = "em"

    refs_html = "\n".join(f'                    <li>📍 {r}</li>' for r in refs)
    title = f"MilkyPot {prep} {nome} | Delivery Londrina"
    desc = f"Peça açaí, milkshake e sobremesas MilkyPot com delivery {prep} {nome}, Londrina. Entrega em {tempo}. Peça pelo site ou WhatsApp!"
    slug_clean = slug

    # Cross-links para outros locais
    outros = [l for l in LOCAIS if l[0] != slug][:12]
    outros_html = "\n".join(
        f'                    <a href="/londrina/ruas/{l[0]}/" class="bairro-link">{l[1]}</a>'
        for l in outros
    )

    html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title[:60]}</title>
    <meta name="description" content="{desc[:155]}">
    <meta name="keywords" content="açaí {nome.lower()}, milkshake {nome.lower()}, delivery {nome.lower()} londrina, milkypot {nome.lower()}, sorveteria {nome.lower()}">
    <link rel="canonical" href="https://milkypot.com/londrina/ruas/{slug_clean}/">
    <meta property="og:title" content="{title[:60]}">
    <meta property="og:description" content="{desc[:155]}">
    <meta property="og:url" content="https://milkypot.com/londrina/ruas/{slug_clean}/">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="MilkyPot">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/animations.css">
    <link rel="stylesheet" href="/css/responsive.css">
    <link rel="stylesheet" href="/css/mobile-app.css">
    <link rel="stylesheet" href="/css/londrina-seo.css">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#42A5F5">
    <link rel="apple-touch-icon" href="/images/logo-milkypot.png">

    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "MilkyPot - {nome}, Londrina",
        "description": "{desc}",
        "url": "https://milkypot.com/londrina/ruas/{slug_clean}/",
        "telephone": "(43) 99999-9999",
        "address": {{
            "@type": "PostalAddress",
            "streetAddress": "Rua Quintino Bocaiúva, Centro",
            "addressLocality": "Londrina",
            "addressRegion": "PR",
            "addressCountry": "BR"
        }},
        "areaServed": {{
            "@type": "Place",
            "name": "{nome}, Londrina, PR"
        }},
        "priceRange": "$$",
        "servesCuisine": ["Açaí", "Milkshake", "Sorvete", "Sobremesas"],
        "image": "https://milkypot.com/images/logo-milkypot.png"
    }}
    </script>
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {{"@type": "Question", "name": "MilkyPot entrega {prep} {nome}?", "acceptedAnswer": {{"@type": "Answer", "text": "Sim! Nossa loja fica no Centro de Londrina e entregamos {prep} {nome} com tempo estimado de {tempo}."}}}},
            {{"@type": "Question", "name": "Qual o tempo de entrega para {nome}?", "acceptedAnswer": {{"@type": "Answer", "text": "O tempo estimado de entrega para {nome} é de {tempo}, saindo da nossa loja na Rua Quintino Bocaiúva, Centro."}}}},
            {{"@type": "Question", "name": "Como pedir açaí {prep} {nome} em Londrina?", "acceptedAnswer": {{"@type": "Answer", "text": "Acesse milkypot.com, escolha seus sabores e informe seu endereço {prep} {nome}. Também aceitamos pedidos pelo WhatsApp."}}}}
        ]
    }}
    </script>
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {{"@type": "ListItem", "position": 1, "name": "MilkyPot", "item": "https://milkypot.com/"}},
            {{"@type": "ListItem", "position": 2, "name": "Londrina", "item": "https://milkypot.com/londrina/"}},
            {{"@type": "ListItem", "position": 3, "name": "Centro", "item": "https://milkypot.com/londrina/centro/"}},
            {{"@type": "ListItem", "position": 4, "name": "{nome}", "item": "https://milkypot.com/londrina/ruas/{slug_clean}/"}}
        ]
    }}
    </script>
</head>
<body>
    <nav class="navbar" id="navbar">
        <div class="nav-container">
            <a href="/" class="logo">
                <img src="/images/logo-milkypot.png" alt="MilkyPot" class="logo-img">
            </a>
            <ul class="nav-links" id="navLinks">
                <li><a href="/">Início</a></li>
                <li><a href="/cardapio.html">Cardápio</a></li>
                <li><a href="/londrina/">Londrina</a></li>
                <li><a href="/#franquia">Seja Franqueado</a></li>
                <li><a href="/#contato">Contato</a></li>
            </ul>
            <div class="nav-actions">
                <a href="/#produtos" class="btn-primary-small">Pedir Agora</a>
                <button class="hamburger" id="hamburger" aria-label="Menu">
                    <span></span><span></span><span></span>
                </button>
            </div>
        </div>
    </nav>

    <main class="londrina-page">
        <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="/">Início</a> › <a href="/londrina/">Londrina</a> › <a href="/londrina/centro/">Centro</a> › <strong>{nome}</strong>
        </nav>

        <section class="bairro-hero">
            <div class="container">
                <div class="bairro-hero-content">
                    <span class="badge-store">{tipo_badge}</span>
                    <h1>Delivery MilkyPot {prep} {nome}, Londrina</h1>
                    <p class="bairro-subtitle">Açaí, milkshake e sobremesas personalizadas com entrega em {tempo}</p>
                    <div class="bairro-actions">
                        <a href="/#produtos" class="btn-primary">🍨 Pedir Agora</a>
                        <a href="https://wa.me/5543999999999?text=Oi!%20Quero%20pedir%20MilkyPot%20{prep}%20{nome.replace(" ", "%20")}!" class="btn-secondary" target="_blank" rel="noopener">💬 WhatsApp</a>
                    </div>
                </div>
            </div>
        </section>

        <section class="bairro-about">
            <div class="container">
                <h2>Açaí e Milkshake {prep} {nome}</h2>
                <p>A MilkyPot entrega {prep} <strong>{nome}</strong> em Londrina! Nossa loja fica na <strong>Rua Quintino Bocaiúva, no Centro</strong>, e atendemos toda essa região com entrega rápida em embalagem térmica. Peça pelo site ou WhatsApp.</p>
                <div class="delivery-info-grid">
                    <div class="delivery-card">
                        <span class="dc-icon">⏱️</span>
                        <strong>{tempo}</strong>
                        <span>Tempo estimado</span>
                    </div>
                    <div class="delivery-card">
                        <span class="dc-icon">🗺️</span>
                        <strong>Centro de Londrina</strong>
                        <span>Loja na Quintino Bocaiúva</span>
                    </div>
                    <div class="delivery-card">
                        <span class="dc-icon">📦</span>
                        <strong>Embalagem Térmica</strong>
                        <span>Chega na temperatura certa</span>
                    </div>
                </div>
            </div>
        </section>

        <section class="bairro-combos">
            <div class="container">
                <h2>O que pedir {prep} {nome}?</h2>
                <p>Nosso cardápio completo disponível para entrega na sua região:</p>
                <div class="combos-list">
                    <div class="combo-item"><span class="combo-icon">🍨</span><span>Açaí personalizado (monte do seu jeito)</span></div>
                    <div class="combo-item"><span class="combo-icon">🥤</span><span>Milkshake cremoso com toppings</span></div>
                    <div class="combo-item"><span class="combo-icon">💪</span><span>Linha Fit — zero açúcar e proteico</span></div>
                </div>
                <a href="/cardapio.html" class="btn-secondary" style="margin-top:20px">Ver cardápio completo →</a>
            </div>
        </section>

        <section class="bairro-landmarks">
            <div class="container">
                <h2>Entregamos perto de</h2>
                <ul class="landmarks-list">
{refs_html}
                    <li>📍 Rua Quintino Bocaiúva (nossa loja)</li>
                    <li>📍 Calçadão da Avenida Paraná</li>
                </ul>
                <p>Entregamos {prep} {nome} e em toda a região central de Londrina num raio de 3km da nossa loja.</p>
            </div>
        </section>

        <section class="bairro-faq">
            <div class="container">
                <h2>Perguntas frequentes — {nome}</h2>

                <div class="faq-item">
                    <button class="faq-question" onclick="this.parentElement.classList.toggle('open')">
                        <span>MilkyPot entrega {prep} {nome}?</span>
                        <span class="faq-arrow">▾</span>
                    </button>
                    <div class="faq-answer"><p>Sim! Nossa loja fica na Rua Quintino Bocaiúva, no Centro de Londrina, e entregamos {prep} {nome} com tempo estimado de {tempo}.</p></div>
                </div>
                <div class="faq-item">
                    <button class="faq-question" onclick="this.parentElement.classList.toggle('open')">
                        <span>Qual o tempo de entrega para {nome}?</span>
                        <span class="faq-arrow">▾</span>
                    </button>
                    <div class="faq-answer"><p>O tempo estimado é de {tempo}, saindo da nossa loja na Quintino Bocaiúva, Centro de Londrina. Usamos embalagem térmica para manter a qualidade.</p></div>
                </div>
                <div class="faq-item">
                    <button class="faq-question" onclick="this.parentElement.classList.toggle('open')">
                        <span>Como pedir açaí {prep} {nome} em Londrina?</span>
                        <span class="faq-arrow">▾</span>
                    </button>
                    <div class="faq-answer"><p>Acesse milkypot.com, escolha seus sabores favoritos e informe seu endereço {prep} {nome}. Também aceitamos pedidos pelo WhatsApp.</p></div>
                </div>
            </div>
        </section>

        <section class="bairro-cta">
            <div class="container">
                <h2>Peça MilkyPot {prep} {nome} agora!</h2>
                <p>Escolha como prefere fazer seu pedido:</p>
                <div class="cta-buttons">
                    <a href="/#produtos" class="btn-primary btn-lg">🍨 Pedir pelo Site</a>
                    <a href="https://wa.me/5543999999999?text=Oi!%20Quero%20pedir%20MilkyPot%20{prep}%20{nome.replace(" ", "%20")}!" class="btn-secondary btn-lg" target="_blank" rel="noopener">💬 Pedir por WhatsApp</a>
                </div>
            </div>
        </section>

        <section class="bairro-outros">
            <div class="container">
                <h3>Ruas e bairros que atendemos em Londrina</h3>
                <div class="bairros-grid">
{outros_html}
                    <a href="/londrina/centro/" class="bairro-link">Centro</a>
                    <a href="/londrina/" class="bairro-link">Ver todos os bairros</a>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <img src="/images/logo-milkypot.png" alt="MilkyPot" class="footer-logo-img" loading="lazy">
                    <p>O potinho mais feliz do mundo! Açaí, milkshake e sobremesas em Londrina.</p>
                </div>
                <div class="footer-links">
                    <h4>Links</h4>
                    <a href="/">Início</a>
                    <a href="/#produtos">Produtos</a>
                    <a href="/#pedir">Pedir Agora</a>
                    <a href="/#franquia">Franquia</a>
                </div>
                <div class="footer-links">
                    <h4>Londrina</h4>
                    <a href="/londrina/">Todos os bairros</a>
                    <a href="/londrina/centro/">Centro</a>
                    <a href="/londrina/gleba-palhano/">Gleba Palhano</a>
                    <a href="/londrina/universitario/">Universitário</a>
                </div>
                <div class="footer-links">
                    <h4>Institucional</h4>
                    <a href="/privacidade.html">Privacidade</a>
                    <a href="/termos.html">Termos de Uso</a>
                    <a href="/#franquia">Seja Franqueado</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 MilkyPot. Todos os direitos reservados.</p>
            </div>
        </div>
    </footer>

    <script>
    var h=document.getElementById('hamburger'),n=document.getElementById('navLinks');
    if(h)h.addEventListener('click',function(){{n.classList.toggle('active');h.classList.toggle('active');}});
    </script>
</body>
</html>'''
    return html


def enriquecer_centro():
    """Adiciona seção de ruas e micro-bairros atendidos na página do Centro."""
    ruas = [l for l in LOCAIS if l[2] == "rua"]
    micro = [l for l in LOCAIS if l[2] == "bairro"]

    ruas_links = "\n".join(
        f'                    <li><a href="/londrina/ruas/{l[0]}/">Delivery {l[1]}</a></li>'
        for l in ruas
    )
    micro_links = "\n".join(
        f'                    <li><a href="/londrina/ruas/{l[0]}/">Delivery {l[1]}</a></li>'
        for l in micro
    )

    section = f'''
        <section class="bairro-ruas-cobertura">
            <div class="container">
                <h2>Ruas que atendemos no Centro de Londrina</h2>
                <p>Nossa loja fica na <strong>Rua Quintino Bocaiúva</strong> e entregamos em todas as ruas num raio de 3km. Confira:</p>

                <h3>📍 Ruas Principais</h3>
                <ul class="ruas-coverage-list">
{ruas_links}
                </ul>

                <h3>🏘️ Bairros Próximos (até 3km)</h3>
                <ul class="ruas-coverage-list">
{micro_links}
                </ul>
            </div>
        </section>'''
    return section


def main():
    # 1. Gerar páginas individuais para cada rua/micro-bairro
    out_dir = os.path.join(BASE, "londrina", "ruas")
    count = 0
    for slug, nome, tipo, refs, tempo in LOCAIS:
        page_dir = os.path.join(out_dir, slug)
        os.makedirs(page_dir, exist_ok=True)
        html = gerar_pagina_rua(slug, nome, tipo, refs, tempo)
        with open(os.path.join(page_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(html)
        count += 1
        print(f"  ✅ /londrina/ruas/{slug}/")

    # 2. Enriquecer página do Centro com seção de cobertura de ruas
    centro_path = os.path.join(BASE, "londrina", "centro", "index.html")
    if os.path.exists(centro_path):
        with open(centro_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Inserir seção de ruas antes do CTA final
        if "bairro-ruas-cobertura" not in content:
            insertion = enriquecer_centro()
            marker = '<section class="bairro-cta">'
            if marker in content:
                content = content.replace(marker, insertion + "\n\n        " + marker)
                with open(centro_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"\n  ✅ Centro page enriched with street coverage")

    # 3. Enriquecer hub /londrina/ com link para ruas
    hub_path = os.path.join(BASE, "londrina", "index.html")
    if os.path.exists(hub_path):
        with open(hub_path, "r", encoding="utf-8") as f:
            hub = f.read()

        if "ruas-centro-section" not in hub:
            ruas_grid = "\n".join(
                f'                    <a href="/londrina/ruas/{l[0]}/" class="bairro-link">{l[1]}</a>'
                for l in LOCAIS
            )
            ruas_section = f'''
        <section class="ruas-centro-section">
            <div class="container">
                <h2>Ruas e bairros que atendemos no Centro</h2>
                <p>Entregamos em todas as ruas num raio de 3km da nossa loja na Quintino Bocaiúva:</p>
                <div class="bairros-grid">
{ruas_grid}
                </div>
            </div>
        </section>'''
            footer_marker = '<footer'
            if footer_marker in hub:
                hub = hub.replace(footer_marker, ruas_section + "\n\n    " + footer_marker)
                with open(hub_path, "w", encoding="utf-8") as f:
                    f.write(hub)
                print(f"\n  ✅ Hub page enriched with streets section")

    print(f"\n🎉 Gerado {count} páginas de ruas/micro-bairros!")
    print(f"📁 Base: /londrina/ruas/<slug>/")


if __name__ == "__main__":
    main()
