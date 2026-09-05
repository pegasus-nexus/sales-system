import codecs

with codecs.open("frontend/src/pages/PremiosWebPage.tsx", "r", "utf-8", errors="ignore") as f:
    content = f.read()

content = content.replace("dinAmicos", "dinámicos")
content = content.replace("DescripciA3n", "Descripción")
content = content.replace("tAtulo", "título")
content = content.replace("descripciAn", "descripción")
content = content.replace("estarAs", "estarás")
content = content.replace("podrAa", "podría")
content = content.replace("AEstAs", "¿Estás")
content = content.replace("ACUIDADO!", "¡CUIDADO!")
content = content.replace("AATENCIA\"N!", "¡ATENCIÓN!")

with codecs.open("frontend/src/pages/PremiosWebPage.tsx", "w", "utf-8") as f:
    f.write(content)
