#!/usr/bin/env python3
"""
Gerador de páginas HTML de SEO local para os bairros de Londrina.
Adiciona ao site principal milkypot.com sem tocar em nenhum arquivo existente.
Cria: /londrina/index.html, /londrina/<bairro>/index.html
"""
import json, os, pathlib

BAIRROS = [
    {"slug":"centro","name":"Centro","zone":"Central","eta":"10-20","landmarks":["Calçadão de Londrina","Catedral Metropolitana","Estação Cultural"],"hasStore":True,
     "desc":"Nossa loja física no coração de Londrina. Venha nos visitar no Calçadão e prove o açaí mais cremoso da região central. Atendimento presencial com todo carinho MilkyPot.",
     "combos":"Combo Calçadão (açaí 500ml + topping), Milkshake Catedral (exclusivo da loja), Picolé Praça Willie"},
    {"slug":"gleba-palhano","name":"Gleba Palhano","zone":"Sul","eta":"20-35","landmarks":["Shopping Catuaí","Boulevard Catuaí","Lago Igapó 2"],"hasStore":False,
     "desc":"Delivery premium para a região mais sofisticada de Londrina. Moradores da Gleba Palhano pedem muito nosso açaí fit e milkshakes artesanais após o treino nas academias da região.",
     "combos":"Açaí Fit Palhano (sem açúcar + whey), Milkshake Catuaí (tamanho família), Combo Lago Igapó (2 potes + frete grátis)"},
    {"slug":"aurora","name":"Aurora","zone":"Oeste","eta":"20-35","landmarks":["Centro Comercial Aurora","Parque Arthur Thomas"],"hasStore":False,
     "desc":"Entregamos na Aurora com rapidez surpreendente! Os moradores da zona oeste adoram nossos combos família nos finais de semana, especialmente depois de passear no Parque Arthur Thomas.",
     "combos":"Combo Família Aurora (3 potes), Milkshake Thomas (morango com Nutella), Açaí do Parque"},
    {"slug":"bela-suica","name":"Bela Suíça","zone":"Sul","eta":"20-35","landmarks":["Lago Igapó","Avenida Higienópolis"],"hasStore":False,
     "desc":"Bairro nobre da zona sul com famílias exigentes que valorizam qualidade. Nosso delivery chega impecável na Bela Suíça com embalagens térmicas que mantêm a cremosidade perfeita.",
     "combos":"Açaí Premium Suíça (polpa pura + castanhas), Milkshake Higienópolis (Ovomaltine), Picolé Gourmet Lago"},
    {"slug":"shangri-la","name":"Shangri-lá","zone":"Norte","eta":"25-40","landmarks":["Shopping Norte","Avenida Saul Elkind"],"hasStore":False,
     "desc":"A zona norte de Londrina merece MilkyPot! Atendemos toda a região do Shangri-lá com entregas rápidas. A galera daqui adora nossos milkshakes gelados nos dias quentes.",
     "combos":"Milkshake Elkind (chocolate trufado), Açaí Norte (granola + banana), Combo Shangri (2 por 1 às terças)"},
    {"slug":"universitario","name":"Universitário","zone":"Leste","eta":"15-30","landmarks":["UEL - Universidade Estadual de Londrina","Hospital Universitário"],"hasStore":False,
     "desc":"Pertinho da UEL, o bairro Universitário é território MilkyPot! Estudantes e professores pedem muito nosso açaí energético entre as aulas. Delivery rápido no campus inteiro.",
     "combos":"Açaí Universitário (guaraná + granola power), Milkshake do Intervalo, Combo Estudante (preço especial)"},
    {"slug":"igapo","name":"Igapó","zone":"Norte","eta":"25-40","landmarks":["Conjunto Habitacional","Terminal de Igapó"],"hasStore":False,
     "desc":"Igapó recebe MilkyPot com entrega dentro do prazo sempre! Os moradores da zona norte confiam na qualidade dos nossos produtos e na pontualidade das nossas entregas.",
     "combos":"Açaí Família Igapó (1 litro), Milkshake Terminal (rápido e gelado), Combo Norte Feliz"},
    {"slug":"jardim-piza","name":"Jardim Piza","zone":"Leste","eta":"25-40","landmarks":["Avenida Arthur Thomas","Terminal Central de Londrina"],"hasStore":False,
     "desc":"No Jardim Piza, a tradição encontra o sabor MilkyPot. Atendemos toda a região leste com carinho e velocidade, levando nossas sobremesas geladas até a porta da sua casa.",
     "combos":"Açaí Arthur Thomas (500ml + cobertura), Milkshake Piza (leite Ninho), Combo Leste Gelado"},
    {"slug":"vitoria-regia","name":"Vitória Régia","zone":"Sul","eta":"20-35","landmarks":["Avenida Dez de Dezembro","Colégio Estadual"],"hasStore":False,
     "desc":"Vitória Régia é um dos bairros que mais cresce em Londrina e o consumo de açaí acompanha! Entregamos com temperatura perfeita usando nossas bolsas térmicas profissionais.",
     "combos":"Açaí Vitória (tamanho rei 700ml), Milkshake Dezembro (frutas vermelhas), Picolé Régia"},
    {"slug":"ouro-verde","name":"Ouro Verde","zone":"Oeste","eta":"25-40","landmarks":["Conjunto Ouro Verde","Centro Comunitário"],"hasStore":False,
     "desc":"Delivery MilkyPot chegando forte no Ouro Verde! A comunidade já conhece nossos sabores e pede cada vez mais. Frete acessível e produtos que chegam perfeitos.",
     "combos":"Combo Ouro (açaí + milkshake), Picolé Comunitário (preço amigo), Açaí Verde (kiwi + hortelã)"},
    {"slug":"jardim-alvorada","name":"Jardim Alvorada","zone":"Oeste","eta":"20-35","landmarks":["Avenida Winston Churchill","Shopping Londrina Norte"],"hasStore":False,
     "desc":"O Jardim Alvorada fica numa posição estratégica e nossos motoboys chegam rapidinho! Região com forte demanda por sobremesas geladas, especialmente nos fins de semana.",
     "combos":"Açaí Alvorada (com paçoca), Milkshake Churchill (cookies), Combo Fim de Semana"},
    {"slug":"cinco-conjuntos","name":"Cinco Conjuntos","zone":"Norte","eta":"25-40","landmarks":["Região dos Cinco Conjuntos","Parque Linear"],"hasStore":False,
     "desc":"Cinco Conjuntos tem um volume impressionante de pedidos MilkyPot! A galera da zona norte sabe que qualidade não precisa ser cara. Temos opções para todos os bolsos.",
     "combos":"Açaí Popular (preço justo, sabor premium), Milkshake Parque (banana + Nutella), Combo 5 em 1"},
    {"slug":"quebec","name":"Quebec","zone":"Sul","eta":"20-35","landmarks":["Jardim Quebec","Parque Ecológico"],"hasStore":False,
     "desc":"O Quebec é vizinho das áreas mais arborizadas de Londrina e nada combina mais com natureza do que um açaí bem cremoso. Entregamos rapidinho nessa região privilegiada.",
     "combos":"Açaí Ecológico (orgânico + mel), Milkshake Quebec (morango natural), Picolé do Parque"},
    {"slug":"vila-brasil","name":"Vila Brasil","zone":"Leste","eta":"20-35","landmarks":["Avenida Brasil","Praça da Vila"],"hasStore":False,
     "desc":"Vila Brasil é tradição em Londrina e MilkyPot honra essa história trazendo sobremesas artesanais com ingredientes selecionados. Delivery confiável na zona leste inteira.",
     "combos":"Açaí Brasil (açaí puro da Amazônia), Milkshake Vila (Ovomaltine + sorvete), Combo Tradição"},
    {"slug":"esperanca","name":"Esperança","zone":"Oeste","eta":"25-40","landmarks":["Jardim Esperança","Centro de Saúde"],"hasStore":False,
     "desc":"Levamos esperança e sabor para o Jardim Esperança! Nossos entregadores conhecem bem a região e garantem que seu pedido chega no tempo certinho, geladinho e perfeito.",
     "combos":"Açaí Esperança (fit + whey), Milkshake Jardim (maracujá cremoso), Combo Saúde (sem açúcar)"}
]

def gen_page(b, all_bairros):
    other_bairros_links = ""
    for ob in all_bairros:
        if ob["slug"] != b["slug"]:
            other_bairros_links += f'                    <a href="/londrina/{ob["slug"]}/" class="bairro-link">{ob["name"]}</a>\n'
    
    store_badge = '<span class="badge-store">🏪 Loja Física</span>' if b.get("hasStore") else '<span class="badge-delivery">🚚 Delivery</span>'
    
    faq_items = f"""
                <div class="faq-item">
                    <button class="faq-question" onclick="this.parentElement.classList.toggle('open')">
                        <span>MilkyPot entrega em {b['name']}?</span>
                        <span class="faq-arrow">▾</span>
                    </button>
                    <div class="faq-answer"><p>Sim! Entregamos em todo o bairro {b['name']} e região, com tempo estimado de {b['eta']} minutos. Nossos motoboys conhecem bem a zona {b['zone'].lower()} de Londrina.</p></div>
                </div>
                <div class="faq-item">
                    <button class="faq-question" onclick="this.parentElement.classList.toggle('open')">
                        <span>Qual o tempo de entrega para {b['name']}?</span>
                        <span class="faq-arrow">▾</span>
                    </button>
                    <div class="faq-answer"><p>O tempo estimado de entrega para {b['name']} é de {b['eta']} minutos, saindo da nossa base no Centro de Londrina. Usamos embalagens térmicas para manter a qualidade.</p></div>
                </div>
                <div class="faq-item">
                    <button class="faq-question" onclick="this.parentElement.classList.toggle('open')">
                        <span>Quais produtos MilkyPot estão disponíveis em {b['name']}?</span>
                        <span class="faq-arrow">▾</span>
                    </button>
                    <div class="faq-answer"><p>Todo o cardápio MilkyPot está disponível: açaí, milkshakes, sorvetes, picolés e combos especiais. Destaques na região: {b['combos']}.</p></div>
                </div>
                <div class="faq-item">
                    <button class="faq-question" onclick="this.parentElement.classList.toggle('open')">
                        <span>Como pedir MilkyPot em {b['name']}, Londrina?</span>
                        <span class="faq-arrow">▾</span>
                    </button>
                    <div class="faq-answer"><p>Você pode pedir pelo nosso site milkypot.com, pelo iFood buscando "MilkyPot" ou pelo WhatsApp. Selecione a loja mais próxima e monte seu pedido!</p></div>
                </div>
                <div class="faq-item">
                    <button class="faq-question" onclick="this.parentElement.classList.toggle('open')">
                        <span>O açaí chega gelado em {b['name']}?</span>
                        <span class="faq-arrow">▾</span>
                    </button>
                    <div class="faq-answer"><p>Com certeza! Usamos bolsas térmicas profissionais com tripla camada que mantêm a temperatura ideal durante todo o trajeto até a zona {b['zone'].lower()} de Londrina.</p></div>
                </div>"""

    landmarks_html = "".join([f'<li>📍 {l}</li>' for l in b["landmarks"]])

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MilkyPot {b['name']} Londrina | Açaí e Milkshake Delivery</title>
    <meta name="description" content="Peça açaí, milkshake e sorvete MilkyPot com delivery em {b['name']}, Londrina. Entrega em {b['eta']} min. Peça pelo site, iFood ou WhatsApp!">
    <meta name="keywords" content="açaí {b['name'].lower()} londrina, milkshake {b['name'].lower()}, sorveteria {b['name'].lower()} londrina, delivery {b['name'].lower()} londrina, milkypot {b['name'].lower()}">
    <link rel="canonical" href="https://milkypot.com/londrina/{b['slug']}/">
    <meta property="og:title" content="MilkyPot em {b['name']} - Delivery Londrina">
    <meta property="og:description" content="{b['desc'][:150]}">
    <meta property="og:url" content="https://milkypot.com/londrina/{b['slug']}/">
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
        "name": "MilkyPot - {b['name']}, Londrina",
        "description": "{b['desc'][:200]}",
        "url": "https://milkypot.com/londrina/{b['slug']}/",
        "telephone": "(43) 99999-9999",
        "address": {{
            "@type": "PostalAddress",
            "addressLocality": "Londrina",
            "addressRegion": "PR",
            "addressCountry": "BR"
        }},
        "areaServed": {{
            "@type": "Place",
            "name": "{b['name']}, Londrina, PR"
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
            {{"@type": "Question", "name": "MilkyPot entrega em {b['name']}?", "acceptedAnswer": {{"@type": "Answer", "text": "Sim! Entregamos em todo o bairro {b['name']} com tempo estimado de {b['eta']} minutos."}}}},
            {{"@type": "Question", "name": "Qual o tempo de entrega para {b['name']}?", "acceptedAnswer": {{"@type": "Answer", "text": "O tempo estimado é de {b['eta']} minutos saindo do Centro de Londrina."}}}},
            {{"@type": "Question", "name": "O açaí chega gelado em {b['name']}?", "acceptedAnswer": {{"@type": "Answer", "text": "Sim! Usamos bolsas térmicas profissionais com tripla camada."}}}}
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
            {{"@type": "ListItem", "position": 3, "name": "{b['name']}", "item": "https://milkypot.com/londrina/{b['slug']}/"}}
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
            <a href="/">Início</a> › <a href="/londrina/">Londrina</a> › <strong>{b['name']}</strong>
        </nav>

        <section class="bairro-hero">
            <div class="container">
                <div class="bairro-hero-content">
                    {store_badge}
                    <h1>MilkyPot em {b['name']}, Londrina</h1>
                    <p class="bairro-subtitle">Açaí, milkshake e sorvete com delivery em {b['eta']} min na zona {b['zone'].lower()}</p>
                    <div class="bairro-actions">
                        <a href="/#produtos" class="btn-primary">🍨 Pedir Agora</a>
                        <a href="https://wa.me/5543999999999?text=Oi!%20Quero%20pedir%20MilkyPot%20em%20{b['name']}!" class="btn-secondary" target="_blank" rel="noopener">💬 WhatsApp</a>
                    </div>
                </div>
            </div>
        </section>

        <section class="bairro-about">
            <div class="container">
                <h2>Delivery MilkyPot em {b['name']}</h2>
                <p>{b['desc']}</p>
                <div class="delivery-info-grid">
                    <div class="delivery-card">
                        <span class="dc-icon">⏱️</span>
                        <strong>{b['eta']} min</strong>
                        <span>Tempo estimado</span>
                    </div>
                    <div class="delivery-card">
                        <span class="dc-icon">🗺️</span>
                        <strong>Zona {b['zone']}</strong>
                        <span>Região de Londrina</span>
                    </div>
                    <div class="delivery-card">
                        <span class="dc-icon">📦</span>
                        <strong>Embalagem Térmica</strong>
                        <span>Temperatura perfeita</span>
                    </div>
                </div>
            </div>
        </section>

        <section class="bairro-combos">
            <div class="container">
                <h2>Mais pedidos em {b['name']}</h2>
                <p>Confira os combos favoritos dos moradores da região:</p>
                <div class="combos-list">
                    {"".join([f'<div class="combo-item"><span class="combo-icon">🍨</span><span>{c.strip()}</span></div>' for c in b['combos'].split(',')])}
                </div>
                <a href="/cardapio.html" class="btn-secondary" style="margin-top:20px">Ver cardápio completo →</a>
            </div>
        </section>

        <section class="bairro-landmarks">
            <div class="container">
                <h2>Entregamos perto de</h2>
                <ul class="landmarks-list">
                    {landmarks_html}
                </ul>
                <p>E em todas as ruas e condomínios do bairro {b['name']} e arredores.</p>
            </div>
        </section>

        <section class="bairro-faq">
            <div class="container">
                <h2>Perguntas frequentes — {b['name']}</h2>
                {faq_items}
            </div>
        </section>

        <section class="bairro-cta">
            <div class="container">
                <h2>Peça MilkyPot em {b['name']} agora!</h2>
                <p>Escolha como prefere fazer seu pedido:</p>
                <div class="cta-buttons">
                    <a href="/#produtos" class="btn-primary btn-lg">🍨 Pedir pelo Site</a>
                    <a href="https://wa.me/5543999999999?text=Oi!%20Quero%20pedir%20MilkyPot%20em%20{b['name']}!" class="btn-secondary btn-lg" target="_blank" rel="noopener">💬 Pedir por WhatsApp</a>
                </div>
            </div>
        </section>

        <section class="bairro-outros">
            <div class="container">
                <h3>MilkyPot em outros bairros de Londrina</h3>
                <div class="bairros-grid">
{other_bairros_links}                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <img src="/images/logo-milkypot.png" alt="MilkyPot" class="footer-logo-img" loading="lazy">
                    <p>O potinho mais feliz do mundo! Levando alegria e sabor para todo o Brasil.</p>
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
    // Hamburger menu
    var h=document.getElementById('hamburger'),n=document.getElementById('navLinks');
    if(h)h.addEventListener('click',function(){{n.classList.toggle('active');h.classList.toggle('active');}});
    </script>
</body>
</html>"""


def gen_hub():
    links = ""
    for b in BAIRROS:
        badge = "🏪 Loja" if b.get("hasStore") else "🚚 Delivery"
        links += f"""
                <a href="/londrina/{b['slug']}/" class="bairro-card">
                    <span class="bc-badge">{badge}</span>
                    <h3>{b['name']}</h3>
                    <span class="bc-zone">Zona {b['zone']} · {b['eta']} min</span>
                </a>"""
    
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MilkyPot Londrina | Delivery de Açaí e Milkshake por Bairro</title>
    <meta name="description" content="MilkyPot Londrina: delivery de açaí, milkshake e sorvete em todos os bairros. Centro, Gleba Palhano, Aurora, Universitário e mais. Peça agora!">
    <link rel="canonical" href="https://milkypot.com/londrina/">
    <meta property="og:title" content="MilkyPot Londrina - Delivery em todos os bairros">
    <meta property="og:description" content="Delivery de açaí, milkshake e sorvete MilkyPot em Londrina. Encontre seu bairro e peça agora!">
    <meta property="og:url" content="https://milkypot.com/londrina/">
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
        "name": "MilkyPot Londrina",
        "url": "https://milkypot.com/londrina/",
        "telephone": "(43) 99999-9999",
        "address": {{
            "@type": "PostalAddress",
            "addressLocality": "Londrina",
            "addressRegion": "PR",
            "addressCountry": "BR"
        }},
        "servesCuisine": ["Açaí", "Milkshake", "Sorvete"],
        "image": "https://milkypot.com/images/logo-milkypot.png"
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
                <li><a href="/londrina/" class="active">Londrina</a></li>
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
            <a href="/">Início</a> › <strong>Londrina</strong>
        </nav>

        <section class="londrina-hero">
            <div class="container">
                <h1>MilkyPot em Londrina</h1>
                <p>Delivery de açaí, milkshake e sorvete em todos os bairros de Londrina, PR. Encontre o seu bairro e peça agora!</p>
            </div>
        </section>

        <section class="londrina-bairros">
            <div class="container">
                <h2>Escolha seu bairro</h2>
                <div class="bairros-hub-grid">{links}
                </div>
            </div>
        </section>

        <section class="londrina-info">
            <div class="container">
                <h2>Por que pedir MilkyPot em Londrina?</h2>
                <div class="info-grid">
                    <div class="info-card">
                        <span>🚚</span>
                        <h3>Delivery em toda Londrina</h3>
                        <p>Atendemos mais de 15 bairros com entregas rápidas entre 10 e 40 minutos.</p>
                    </div>
                    <div class="info-card">
                        <span>🧊</span>
                        <h3>Temperatura perfeita</h3>
                        <p>Embalagens térmicas profissionais que mantêm seu açaí e milkshake gelados.</p>
                    </div>
                    <div class="info-card">
                        <span>⭐</span>
                        <h3>Nota 4.9 no Google</h3>
                        <p>Mais de 2.800 avaliações 5 estrelas de clientes satisfeitos em Londrina.</p>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <img src="/images/logo-milkypot.png" alt="MilkyPot" class="footer-logo-img" loading="lazy">
                    <p>O potinho mais feliz do mundo!</p>
                </div>
                <div class="footer-links">
                    <h4>Links</h4>
                    <a href="/">Início</a>
                    <a href="/#produtos">Produtos</a>
                    <a href="/#franquia">Franquia</a>
                </div>
                <div class="footer-links">
                    <h4>Londrina</h4>
                    <a href="/londrina/centro/">Centro</a>
                    <a href="/londrina/gleba-palhano/">Gleba Palhano</a>
                    <a href="/londrina/universitario/">Universitário</a>
                </div>
                <div class="footer-links">
                    <h4>Institucional</h4>
                    <a href="/privacidade.html">Privacidade</a>
                    <a href="/termos.html">Termos</a>
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
</html>"""


# Generate all pages
root = pathlib.Path(__file__).resolve().parent.parent

# Hub page
hub_dir = root / "londrina"
hub_dir.mkdir(exist_ok=True)
(hub_dir / "index.html").write_text(gen_hub(), encoding="utf-8")
print("Created: londrina/index.html")

# Bairro pages
for b in BAIRROS:
    bdir = hub_dir / b["slug"]
    bdir.mkdir(exist_ok=True)
    (bdir / "index.html").write_text(gen_page(b, BAIRROS), encoding="utf-8")
    print(f"Created: londrina/{b['slug']}/index.html")

print(f"\nDone! {len(BAIRROS)+1} pages generated.")
