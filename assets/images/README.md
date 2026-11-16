# სასწავლო სურათები / არტეფაქტები

აქ ინახება სურათები, რომლებიც გაკვეთილის ბარათებსა და კითხვებში ჩანს.

- ფორმატი: `.jpg`, `.png`, `.webp` (სასურველია), `.gif`, `.svg`, `.avif`
- ფაილის სახელში **არ გამოიყენო ჰარი** — ნაცვლად დაწერე `-` (მაგ. `dmanisi-skull.jpg`)
- ზომა: სიგანე ~800–1200px, წონა სასურველია ≤ 200 KB (მობილური ინტერნეტისთვის)
- ეკრანზე სურათი სათაურის ქვემოთ ჩანს, სიმაღლე მაქსიმუმ 220px (პროპორცია ნარჩუნდება)

სხვისი ფოტოს გამოყენებისას (მაგ. Wikimedia Commons) მიუთითე ავტორი, ლიცენზია და წყარო —
CC ლიცენზიები ამას ითხოვს. თუ ფოტო მოჭერი ან შეცვალე, დაწერე „(მოჭრილია)“.

ტექსტურ შაბლონში:

```text
[თეორია] 🏺 სათაური
სურათი: assets/images/dmanisi-skull.jpg
წარწერა: სურ. 1. დმანისელი ჰომინინის თავის ქალა
ავტორი: ფოტო: სახელი გვარი (მოჭრილია)
ლიცენზია: CC BY-SA 4.0
წყარო: https://commons.wikimedia.org/wiki/File:...
```

`js/data.js`-ში:

```js
image: {
  src: "assets/images/dmanisi-skull.jpg",
  caption: "სურ. 1. დმანისელი ჰომინინის თავის ქალა",
  credit: "ფოტო: სახელი გვარი (მოჭრილია)",
  licenseName: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:...",
},
```

ოფლაინ რეჟიმი: Service Worker სურათებს `ims-images-…` ქეშში ინახავს (მაქს. 120 ფაილი);
გაკვეთილის გახსნისას მისი ყველა სურათი წინასწარ ჩაიტვირთება.

## გამოყენებული სურათები

| ფაილი | აღწერა | ავტორი | ლიცენზია | წყარო |
|---|---|---|---|---|
| `clay-pot.jpg` | ქვევრი ყურძნის მტევნის გამოსახულებებით, ძვ. წ. VI ათასწ. I ნახ., ხრამის დიდი გორა (საქართველოს ეროვნული მუზეუმი); მოჭრილი და შემცირებული | Carole Raddato | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:A_terracotta_Kvevri_used_to_ferment_and_age_wine_decorated_with_depictions_of_bunches_of_grapes,_First_half_of_the_6th_millennium_BC,_from_Khramis_Didid_Gora,_National_Museum_of_Georgia,_Tbilisi,_Georgia.jpg) |
