"""Fabrique une facture PDF « classique » (sans Factur-X), présentée comme celles des
distributeurs agricoles : un texte par cellule, positionné avec Td. Données fictives.
Usage : python3 fabriquer-facture-texte.py facture-texte.pdf"""
import sys, zlib

cellules = [
    # (x, y, taille, texte)
    (26, 821, 8, "15/09/2026"), (83, 821, 8, "FV000123"),
    (232, 792, 8, "Distributeur d'agrofournitures (exemple)"),
    (238, 730, 8, "www.agro-exemple.fr"),
    (26, 671, 8, "N° T.V.A. : FR99 999999999"),
    (25, 597, 9, "FACTURE N° FV000123"), (532, 597, 8, "Page : 1"),
    (39, 577, 8, "Code Tiers"), (124, 577, 8, "Date Pièce"),
    (48, 565, 8, "000001"), (124, 565, 8, "15/09/2026"),
    (25, 538, 8, "N° TVA Intracommunautaire :"), (142, 538, 8, "FR 00123456789"),
    (377, 491, 7, "PRIX"), (512, 491, 7, "MONTANT"),
    (33, 486, 7, "RÉFÉRENCE"), (152, 486, 7, "DÉSIGNATION"), (273, 486, 7, "QUANTITÉ"), (328, 486, 7, "UNITÉ"),
    (419, 486, 7, "REMISE"), (463, 486, 7, "PRIX NET"), (563, 486, 7, "T"),
    (369, 482, 7, "UNITAIRE"), (527, 482, 7, "HT"),
    (79, 458, 8, "BON DE LIVRAISON N° BL000456 du 12/09/2026"),
    (25, 438, 8, "40011"), (96, 438, 8, "HERBICIDE EXEMPLE 20L (1 BIDON.)"), (292, 438, 8, "40.000"), (338, 438, 7, "L"),
    (394, 438, 8, "6.50"), (488, 438, 8, "6.50"), (531, 438, 8, "260.00"), (563, 438, 8, "2"),
    (96, 427, 8, "N° AMM  9990001"),
    (102, 416, 8, "Redev.pollution:HERBICIDE EXEMPLE 20L"), (480, 416, 8, "1.1000"), (531, 416, 8, "44.000"), (563, 416, 8, "2"),
    (78, 407, 8, "LOT"), (229, 407, 8, "LOT-AB123"), (294, 407, 8, "(40.000)"),
    (25, 397, 8, "52002"), (96, 397, 8, "BOUILLIE BORDELAISE RSR SAC 25 KG"), (292, 397, 8, "2.000"), (338, 397, 7, "SAC"),
    (394, 397, 8, "95.00"), (419, 397, 8, "5%"), (488, 397, 8, "90.25"), (531, 397, 8, "180.50"), (563, 397, 8, "2"),
    (96, 386, 8, "N° AMM  9990002"),
    (25, 375, 8, "3379"), (96, 375, 8, "PRESTA/LOG"), (292, 375, 8, "40.000"), (330, 375, 7, "UNITE"),
    (394, 375, 8, "0.10"), (488, 375, 8, "0.10"), (539, 375, 8, "4.00"), (563, 375, 8, "2"),
    (28, 179, 7, "T"), (114, 179, 7, "INTITULÉ"), (231, 179, 7, "TX TVA"), (290, 179, 7, "HT"), (345, 179, 7, "TVA"),
    (396, 179, 7, "TAXES"), (447, 179, 7, "TVA TAXE"), (522, 179, 7, "T.T.C."),
    (28, 168, 8, "2"), (42, 168, 8, "BASE 2"), (237, 168, 8, "20 %"), (297, 168, 8, "444.50"), (358, 168, 8, "88.90"),
    (415, 168, 8, "44.00"), (476, 168, 8, "8.80"), (545, 168, 8, "586.20"),
    (42, 154, 8, "TOTAUX"), (290, 154, 8, "444.50"), (353, 154, 8, "88.90"), (410, 154, 8, "44.00"), (473, 154, 8, "8.80"), (530, 154, 8, "586.20 €"),
    (201, 96, 8, "LIBELLE DU COMPTE : SAS AGRO EXEMPLE"),
]

def chaine(t):
    b = t.encode('cp1252')
    return b'(' + b.replace(b'\\', b'\\\\').replace(b'(', b'\\(').replace(b')', b'\\)') + b')'

flux = b''.join(b'BT\n/F1 %d Tf\n%g %g Td\n' % (taille, x, y) + chaine(t) + b' Tj\nET\n' for x, y, taille, t in cellules)
comprime = zlib.compress(flux)
objets = [
    b'<< /Type /Catalog /Pages 2 0 R >>',
    b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    b'<< /Length %d /Filter /FlateDecode >>\nstream\n' % len(comprime) + comprime + b'\nendstream',
    b'<< /Type /Font /Subtype /TrueType /BaseFont /Arial /Encoding /WinAnsiEncoding >>',
]
sortie = b'%PDF-1.3\n'
positions = []
for i, o in enumerate(objets, 1):
    positions.append(len(sortie))
    sortie += b'%d 0 obj\n' % i + o + b'\nendobj\n'
xref = len(sortie)
sortie += b'xref\n0 %d\n0000000000 65535 f \n' % (len(objets) + 1) + b''.join(b'%010d 00000 n \n' % p for p in positions)
sortie += b'trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n' % (len(objets) + 1, xref)
open(sys.argv[1], 'wb').write(sortie)
