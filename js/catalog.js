const FAVORITES_KEY = "atlas_favorites_v1";

const CONTINENT_CLASSES = {
  "Европа": "europe",
  "Азия": "asia",
  "Африка": "africa",
  "Северная Америка": "north-america",
  "Южная Америка": "south-america"
};

function formatNumber(value) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

function saveFavorites(items) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  } catch (error) {
    showToast("Не удалось сохранить избранное.");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  const body = toast.querySelector(".toast-body");
  if (body) body.textContent = message;
  toast.hidden = false;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
    toast.classList.remove("show");
  }, 2800);
}

function continentClass(continent) {
  return CONTINENT_CLASSES[continent] || "other";
}

function flagSrc(code) {
  return "assets/flags/" + code.toLowerCase() + ".png";
}

function countryCard(country) {
  const cls = continentClass(country.continent);
  return `
    <div class="col">
      <article class="card country-card h-100">
        <div class="card-body">
          <div class="country-card-top">
            <div class="country-card-tags">
              <img class="country-flag" src="${flagSrc(country.code)}" alt="Флаг ${country.name}" width="42" height="28" loading="lazy">
              <span class="badge continent-badge badge-${cls}">${country.continent}</span>
            </div>
            <span class="country-code">${country.code}</span>
          </div>
          <h3 class="card-title"><a class="stretched-link" href="country.html?code=${country.code}">${country.name}</a></h3>
          <p class="card-capital">Столица: ${country.capital}</p>
          <dl class="card-facts">
            <div><dt>Население</dt><dd>${formatNumber(country.population)}</dd></div>
            <div><dt>Площадь, км²</dt><dd>${formatNumber(country.area)}</dd></div>
          </dl>
        </div>
      </article>
    </div>
  `;
}

function plural(number, forms) {
  const n = Math.abs(number) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

function renderCatalog() {
  const grid = document.getElementById("countryGrid");
  if (!grid) return;

  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const continent = document.querySelector('input[name="continent"]:checked').value;
  const sort = document.getElementById("sortSelect").value;
  const favoritesOnly = document.getElementById("favoritesOnly").checked;
  const favorites = getFavorites();

  let list = countries.filter((country) => {
    const haystack = `${country.name} ${country.capital} ${country.official}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    const matchesContinent = continent === "all" || country.continent === continent;
    const matchesFavorite = !favoritesOnly || favorites.includes(country.code);
    return matchesSearch && matchesContinent && matchesFavorite;
  });

  if (sort === "population") list.sort((a, b) => b.population - a.population);
  else if (sort === "area") list.sort((a, b) => b.area - a.area);
  else list.sort((a, b) => a.name.localeCompare(b.name, "ru"));

  document.getElementById("resultCount").textContent = list.length + " " + plural(list.length, ["страна", "страны", "стран"]);
  document.getElementById("emptyMessage").hidden = list.length !== 0;
  grid.innerHTML = list.map(countryCard).join("");
}

function initCatalog() {
  if (!document.getElementById("countryGrid")) return;
  document.getElementById("searchInput").addEventListener("input", renderCatalog);
  document.getElementById("sortSelect").addEventListener("change", renderCatalog);
  document.getElementById("favoritesOnly").addEventListener("change", renderCatalog);
  document.querySelectorAll('input[name="continent"]').forEach((input) => {
    input.addEventListener("change", renderCatalog);
  });
  document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("sortSelect").value = "name";
    document.getElementById("favoritesOnly").checked = false;
    document.querySelector('input[name="continent"][value="all"]').checked = true;
    renderCatalog();
  });
  renderCatalog();
}

function factsTable(country) {
  return `
    <dl class="facts-table">
      <div><dt>Официальное название</dt><dd>${country.official}</dd></div>
      <div><dt>Континент</dt><dd>${country.continent}</dd></div>
      <div><dt>Столица</dt><dd>${country.capital}</dd></div>
      <div><dt>Население</dt><dd>${formatNumber(country.population)} чел.</dd></div>
      <div><dt>Площадь</dt><dd>${formatNumber(country.area)} км²</dd></div>
      <div><dt>Валюта</dt><dd>${country.currency}</dd></div>
      <div><dt>Язык</dt><dd>${country.language}</dd></div>
      <div><dt>Форма правления</dt><dd>${country.government}</dd></div>
    </dl>
  `;
}

function relatedLinks(country) {
  return country.related
    .map((code) => countries.find((item) => item.code === code))
    .filter(Boolean)
    .map((item) => `
      <div class="col">
        <a class="card related-card h-100" href="country.html?code=${item.code}">
          <div class="card-body py-2">
            <div class="related-head">
              <img class="country-flag" src="${flagSrc(item.code)}" alt="Флаг ${item.name}" width="42" height="28" loading="lazy">
              <strong>${item.name}</strong>
            </div>
            <span>${item.continent}</span>
          </div>
        </a>
      </div>
    `)
    .join("");
}

function renderCountryPage() {
  const view = document.getElementById("countryView");
  if (!view) return;

  const code = new URLSearchParams(window.location.search).get("code");
  const country = countries.find((item) => item.code === code) || countries.find((item) => item.code === "FR");
  const favorites = getFavorites();
  const isFavorite = favorites.includes(country.code);
  const cls = continentClass(country.continent);
  document.getElementById("breadcrumbName").textContent = country.name;
  document.title = country.name + " – Атлас мира";

  view.innerHTML = `
    <article class="country-page">
      <header class="country-head">
        <div class="row align-items-center g-3">
          <div class="col-lg">
            <div class="country-heading">
              <img class="country-flag-lg" src="${flagSrc(country.code)}" alt="Флаг ${country.name}" width="78" height="52">
              <div>
                <span class="badge continent-badge badge-${cls}">${country.continent}</span>
                <h1>${country.name}</h1>
                <p>${country.official}</p>
              </div>
            </div>
          </div>
          <div class="col-lg-auto country-actions">
            <button class="btn btn-light" id="bookmarkButton" type="button">${isFavorite ? "Убрать из избранного" : "В избранное"}</button>
            <button class="btn btn-outline-light" type="button" onclick="window.print()">Печать</button>
          </div>
        </div>
      </header>

      <div class="row g-4 country-body">
        <div class="col-lg-8">
          <section class="country-section">
            <h2>География</h2>
            ${country.description.map((paragraph) => `<p>${paragraph}</p>`).join("")}
          </section>
          <section class="country-section">
            <h2>Коротко о стране</h2>
            <ul class="fact-list">
              ${country.facts.map((fact) => `<li>${fact}</li>`).join("")}
            </ul>
          </section>
          <section class="country-section">
            <h2>Связанные страны</h2>
            <p>Сравнить страну с другими государствами континента можно в общем списке.</p>
            <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-2">${relatedLinks(country)}</div>
          </section>
        </div>
        <aside class="col-lg-4">
          <div class="card facts-card">
            <div class="card-body">
              <h2>Кратко</h2>
              ${factsTable(country)}
            </div>
          </div>
        </aside>
      </div>
    </article>
  `;

  const bookmark = document.getElementById("bookmarkButton");
  bookmark.addEventListener("click", () => {
    const current = getFavorites();
    const next = current.includes(country.code)
      ? current.filter((item) => item !== country.code)
      : [...current, country.code];
    saveFavorites(next);
    bookmark.textContent = next.includes(country.code) ? "Убрать из избранного" : "В избранное";
    showToast(next.includes(country.code) ? "Страна добавлена в избранное." : "Страна удалена из избранного.");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initCatalog();
  renderCountryPage();
});
