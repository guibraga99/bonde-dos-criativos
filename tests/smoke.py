"""Smoke tests via Playwright. Run: python3 tests/smoke.py"""
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = Path(__file__).resolve().parent.parent
URL = (BASE / 'index.html').as_uri()
OUT = BASE / 'tests'
OUT.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width, height, label in [(1440, 900, 'desktop'), (390, 844, 'mobile')]:
        context = browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=1, locale='pt-BR')
        context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(BASE.as_uri()) else route.abort())
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        page.goto(URL, wait_until='domcontentloaded')
        page.locator('.place-card').first.wait_for(timeout=6000)
        print(label, 'places:', page.locator('.place-card').count(), 'header:', page.title())
        assert page.locator('#dayIntro h3').inner_text() == 'Chegar ao coração da cidade'
        assert page.locator('#savedCount').inner_text() == '0'
        page.locator('[data-day="sex"]').click()
        assert page.locator('#dayIntro h3').inner_text() == 'Do passado ao som do órgão'
        page.locator('[data-day="sab"]').click()
        page.locator('[data-alt="bichinho"]').click()
        assert 'Oficina de Agosto' in page.locator('#timeline').inner_text()
        page.locator('[data-category="cafe"]').click()
        assert page.locator('.place-card').count() >= 3
        page.locator('[data-category="todos"]').click()
        page.locator('#searchPlaces').fill('Matriz')
        assert page.locator('.place-card').count() >= 1
        page.locator('#searchPlaces').fill('')
        page.locator('.card-heart').first.click()
        assert page.locator('#savedCount').inner_text() == '1'
        page.locator('#openSaved').click()
        assert 'Matriz de Santo Antônio' in page.locator('#drawerItems').inner_text()
        page.locator('#drawerShare').click()
        assert 'f=matriz' in page.locator('#shareUrl').input_value()
        page.locator('#shareModal .close-overlay').click()
        page.locator('[data-place="martir"]').first.click()
        assert 'MARTIR' in page.locator('#modalPlaceTitle').inner_text()
        page.locator('#placeModal .close-overlay').click()
        page.locator('[data-food="tropeiro"]').check()
        assert page.locator('#foodProgress').inner_text() == '1 de 8 provados'
        page.locator('[data-region="saojoao"]').click()
        assert 'São João del-Rei' in page.locator('#mapListTitle').inner_text()
        assert not errors, f'JS errors: {errors}'
        dims = page.evaluate('({sw:document.documentElement.scrollWidth,iw:window.innerWidth})')
        print(label,'dimensions',dims,'errors',errors)
        assert dims['sw'] <= dims['iw']+2, f'Horizontal overflow on {label}: {dims}'
        page.goto(URL, wait_until='domcontentloaded')
        page.locator('.place-card').first.wait_for()
        page.screenshot(path=str(OUT / f'{label}-top.png'), full_page=False)
        page.locator('#lugares').scroll_into_view_if_needed()
        page.screenshot(path=str(OUT / f'{label}-places.png'), full_page=False)
        context.close()
    browser.close()
print('Todos os testes passaram.')
