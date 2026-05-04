# Copilot Instructions

## General Guidelines
- The official language for all code, comments, identifiers, and documentation is **English**.
- Always write code, inline comments, XML doc comments, and commit messages in English.

## Error Handling

## Adding a Character to the "Cartridges & Module farm" Table

The farm table lives in `info.html` inside the first `<section class="card farm-card">`.
Each character is one `<tr>` in the `<tbody>`.

### Required data (find on prydwen.gg → character page → Build tab)
| Field | Description |
|---|---|
| Character name | Exact in-game name |
| Portrait path | `img/characters/<Name>_c.webp` (download from prydwen CDN, see below) |
| Cartridge set name | The recommended Console set name |
| Cartridge icon path | `img/cartridges/<kebab-case-name>.webp` (download from prydwen CDN, see below) |
| Location | Where to farm the cartridge set (e.g. "Rabbit Hole") |
| Main Stat | Priority order, e.g. `Crit DMG % > ATK % > Crit Rate %` |
| Sub Stat | Priority order, e.g. `Crit Rate % > Crit DMG % > ATK %` |

### Downloading images
Portrait CDN URL pattern (prydwen.gg):
```
https://www.prydwen.gg/static/<hash>/b26e2/<Name>_c.webp
```
Cartridge icon CDN URL pattern:
```
https://www.prydwen.gg/static/<hash>/d8057/<number>.webp
```
Save portraits to `img/characters/<Name>_c.webp` and cartridge icons to `img/cartridges/<kebab-case-name>.webp`.

### HTML row template
```html
<!-- CharacterName -->
<tr>
  <td class="farm-char">
    <img class="farm-portrait" src="img/characters/<Name>_c.webp" alt="<Name>" loading="lazy">
    <span><Name></span>
  </td>
  <td class="farm-cartridge">
    <img class="farm-cart-icon" src="img/cartridges/<set-name-kebab>.webp" alt="" loading="lazy">
    <span><Set Name></span>
  </td>
  <td><Location></td>
  <td><Main Stat priority></td>
  <td><Sub Stat priority></td>
</tr>
```
Insert the new `<tr>` inside the `<tbody>` of `.farm-table`, sorted alphabetically by character name.

