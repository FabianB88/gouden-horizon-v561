# Gouden Horizon v5.5.1

Een klimaatveldwerker zoekt drie kalibratiekernen voor Aurelia. Het verhaal koppelt herstel aan meting, terugkoppeling en de mogelijkheid om een ingreep weer te stoppen. De vaste campagne bestaat uit zestien gebieden, zes gevechtschapters en twee bewaakte protocolvondsten. Daarnaast zijn twee optionele bergingen herhaalbaar na de eerste kern.

## Gebiedsflow

De Getijdenkade start met veilige aankomst en handelaar. De campagne gebruikt de vaste volgorde in `STORY_ORDER`, van getijdenpomp en atmosferische lens tot laatste weermeting en Aurelia. Handelsposten hebben vaste poorten per bestemming, met verschillende artwork voor arena’s en meetstations. Na een gevechtschapter keert de speler terug naar de regionale post; de volgende eigen poort komt vrij. Zonnetuinen en Zaadkluis vragen hun protocolkist. De kaart toont opeenvolgende hoofdstukken en staat alleen het volgende doel of terugreizen naar een bezocht hoofdstuk toe. De Zoutcentrale en het Wolkenarchief hebben eigen geschilderde art.

Een arena toont geen reisportal zolang er nog vijanden leven of stations onvoltooid zijn. Na alle golven, de bewaker en overige vijanden verschijnt één terugportal. Bij de laatste arena blijft ook de eindconsole beschikbaar. De kaart kiest het verhaaldoel voor de richtingpijl. Eerder voltooide hoofdstukken zijn vanuit een veilige post direct bereikbaar; de vaste poorten wisselen nooit van bestemming. Oude gebieden, verslagen vijanden, caches en voorraad blijven behouden. Terugreizen herstelt geen HP of mana en genereert geen nieuwe loot.

Vier handelsroutes zijn volledig veilig, met drie gespecialiseerde diensten en eenmalige verborgen voorraadkisten. De twee bewaakte protocolroutes hebben een veilige aankomstzone met vijanden en terrein daarbuiten. Handelaar en portals staan op aparte, bereikbare plekken. Transitkisten staan op bereikbare loopvloeren. De Getijdenkade gebruikt het zijterras met verbonden trappen; bij bewaakte kisten staat expliciet dat de bewaker eerst moet worden verslagen. De loopruimte is een union van vloerpolygonen langs geschilderde bruggen en platforms; een navigatielattice helpt vijanden om scenery heen.

## Build en itemprogressie

Links krijgt een zelf gekozen hoofdaanval uit alle geleerde skills. Directe schietspreuken gebruiken bij een klik op de balk de laatst gekozen veldrichting; zonnebom en gebiedsspreuken behouden doelondersteuning. Cijfers richten naar de veldcursor. Het skillmenu toont acht slotkaarten: links, rechts/Q en zes cijfers. De speler kiest eerst een slot en daarna een geleerde aanval; beide muisknoppen reageren onafhankelijk, ook wanneer de andere al wordt vastgehouden. Dubbele bindings delen dezelfde spreukcooldown. Cijfers en rechtsklik voeren direct uit zonder links te veranderen. Nieuwe skills vragen een levelpunt en komen beschikbaar op levels 2 tot 6; punten kunnen worden bewaard. Loopsnelheid, schade, leven, mana en ontwijkherstel blijven aparte permanente keuzes.

Tien aanvallen verschillen in vorm: waaier, kettingstraal, geworpen bom, ijslans, terugkerende boemerang, implosiekern, dwars geplaatste ijsstrook, kleine mobiele tornado, drie gerichte storminslagen per salvo en drie afzonderlijk aangekondigde zonnekraters. De kernpuls heeft een opbouwfase en brede geschilderde schokgolf. Zijn eigen schade en kills geven geen nieuwe lading. Overige lading is gehalveerd, overkill telt niet mee en na gebruik geldt 40 seconden herlaadtijd.

Zes gedragen slots gebruiken 36 loottemplates en vijf zeldzaamheden. Common heeft geen extra affix, Uncommon/Rare één en Epic/Legendary twee. Itemlevel schaalt stats en stelt een spelerslevelvereiste. Vijandfamilies hebben eigen dropkansen, zeldzaamheidsverdelingen en favoriete slots. Gewone dropkansen zijn 65% verlaagd en nemen verder af bij volle vloeren. Ze stoppen bij zeven losse items. Elites geven 60% itemkans; kernbewakers en de eindbaas garanderen een item met betere verdelingen; vier opeenvolgende grote beloningen kunnen niet allemaal een Legendary missen. Zes unieke legendarische effecten hebben triggerdrempels of cooldowns en kunnen zichzelf niet activeren.

Alle vondsten gaan eerst in de rugzak. Vergelijking toont winst en verlies; uitrusten is expliciet. Het vorige onderdeel blijft bewaard. HP- en mana-percentages blijven bij wisselen en versterken behouden. De rugzak heeft 48 plaatsen. Verkopen en recyclen kunnen alleen een concreet, bestaand rugzakitem verwijderen.

Nieuwe groepen schalen hun leven, schade en aanvalspauzes met regio en spelerslevel. Dit wordt eenmalig vastgelegd, zodat gearwissels of terugreizen niet helen of herschalen. Schrapers, schilden en sluipschutters wisselen verschillende aanvalsvormen af; artillerie, orbiters en afstandsschutters hebben eigen bewegingsrollen.

## Handel en checkpoint

Elke post heeft acht blijvende aanbiedingen verdeeld over Mara en Jules; Inez versterkt gear.  latere regio’s verkopen hogere itemlevels. De speler koopt, verkoopt of versterkt gedragen gear tot +3. Verkopen heeft compacte selectierijen, filters op type en zeldzaamheid en meervoudige selectie. De totale opbrengst staat vooraf vast. Een ongeldige selectie betaalt en verwijdert niets; een geldige selectie wordt eenmaal verkocht en opgeslagen. Verkoop is waardevoller dan recyclen. Versterkingen geven slotgebonden bonussen en stijgende kosten. Verband is geprijsd en begrensd tot acht ladingen.

Kampen beschermen tegen vijanden, terrein en projectielen; casten is daar geblokkeerd. Aankomst en succesvolle handel leggen een checkpoint vast. Dit voorkomt het herstellen van verkochte voorraad of geld via retry. Oude V3/V4/V5-saves behouden bestaande gear en voortgang en krijgen de nieuwe slots, instellingen en winkelvoorraad.

Regiobazen hebben drie patronen en een tweede fase op 50% HP. Dredger gebruikt een bewegende waterring, charge en een gericht trekkende lijn. SolarKnight gebruikt radiale projectielen, een sweep en een waaier. Seedheart gebruikt twee wortelstroken met veilige corridor, zaadprojectielen en versterking. Nesten hebben een limiet van drie oproepen; versterking geeft geen farmbare beloningen.

## Art en interface

Geschilderde sprites gebruiken transparantie, voetankers, grondschaduwen en dieptesortering. De v5.2-atlas bevat drie families met twee houdingen. V5.4 gebruikt eigen nieuwe artwork voor de vier rollen en drie regiobazen. Elke regiobaas heeft twee poses. Acht geschilderde looprichtingen bevatten ieder zes frames; ongelijke atlascellen gebruiken exacte silhouet-uitsneden, runtime-clipping en gemeten voetankers. Magneetkrabben leggen vertraagd geactiveerde mijnen en trekken dichtbij; Resonanten vuren een waaier of draaien een smalle straal; Pekelbrekers spuiten een gerichte kegel of leggen twee zoutstroken met een veilige corridor. Twaalf nieuwe itemillustraties gebruiken vaste marges en dezelfde iconen in loot en winkel. De eerdere eigen atlassen bevatten zes vijandfamilies, vier portalvarianten, handelaar, smid, twaalf items en zes gebieds-/kernpulseffecten. Itembeelden worden gedeeld door wereldbuit, rugzak, slots en vergelijking. Zeldzaamheid heeft zowel kleur als geschreven label.

Het veldjournaal gebruikt warm perkament, verweerd teal leer en messing randen. Koop-, verkoop- en versterktabs delen dezelfde itemkaarten en expliciete prijsactie. Het skillmenu gebruikt twee muiskaarten en zes cijferkaarten boven een compacte aanvalspalette. De gekozen aanval toont zijn werking. Smalle schermen gebruiken één winkelkolom en een compacter kaartrooster.

De held behoudt acht geschilderde kijkrichtingen. De looprig gebruikt per richting één vaste pose, knipt alleen de geschilderde broek- en laarspixels uit en beweegt beide benen met tegengestelde voetcontacten en kniebuiging met twee botten. Rechtsgerichte loopposes gebruiken de bijpassende gespiegelde profielpose. Rompverschuiving, lichte contrarotatie en verticale gewichtsverplaatsing verbinden benen en bovenlichaam. Werkelijke afgelegde afstand bepaalt de cyclus; tegen een muur stopt deze en dashes tellen niet als stappen. De 48 bronuitsneden blijven beschikbaar; rust en dashtrails gebruiken hetzelfde heupanker als de looprig. De focusgloed volgt de gebruikte stafpose.

De nieuwe v5.5-atlas bevat 36 poses voor Boogjager, Asgraver, Schildrover, Stormnest, Spuitkever en Gifmeester: vier bewegingen, voorbereiding en aanval. Per familie geldt één schaal; ankers volgen de romp en sluiten gifpluimen uit. Poseblends worden met premultiplied alpha samengesteld, zodat een bewegende vijand niet transparant wordt. Niet opnieuw geschilderde families krijgen wel een zichtbare loslaathouding.

Iedere verzamelde vondst krijgt bevestiging, inclusief Common en kistbeloningen. De melding vergelijkt echte stats met het huidige slot. Kistkeuzes tonen winst én verlies vooraf, naast een nieuw legendarisch effect en het vereiste level. Stats en dropkansen veranderen niet. Uitgeruste gear wisselt alleen na een bewuste keuze; dezelfde grounddrop kan niet tweemaal worden verzameld.

Level-up toont een gouden melding, een lichteffect en vier oplopende noten. Het keuzescherm noemt het bereikte level, +1 punt en nieuwe unlocks. De originele Web Audio-muziek gebruikt langzame harmonieën, belnoten en zelfgegenereerde nagalm; gevechten voegen een zachte spanningspuls toe. Muziek en effecten hebben aparte volumebussen en delen een mute-knop.

## Validatiegrens

136 regeltests plus drie complete campagnes controleren normale voortgang, itemization, economie, invoerscheiding, arena-locks en alle baasfases. De automatische speler mag maximaal twee normale checkpoint-herstarts gebruiken en rapporteert deze afzonderlijk. Een stilstaande schietende speler telt niet als een geblokkeerde looproute. Canvas-frames met de echte art tonen zestien gebieden, tien aanvallen, de nieuwe vijanden, rarity-buit, camp, portal en ultimate. Een minimale DOM voert het echte entrypoint uit en controleert invoer, winkelknoppen, modal/save-overgangen en retries.

Deze checks bewijzen geen uiteindelijke browser-layout, echte audio-uitvoer of mobiele framerate. De automatische speler slaat lezen en menselijke reactietijd over; diens tijd is geen beloofde speelduur.

## Getijdenkade-indeling

De drie handelaren gebruiken afzonderlijke zijpleinen: aankomstplein, tuinterras en westelijke werkplaats. De hoofdroute heeft minimaal een spelerdiameter extra vloerbreedte en geen handelaren binnen 160 wereldpixels van de middenlijn. Trappen overlappen met de hoofdroute en de terrassen; de speler hoeft niet op één exacte diagonaal te mikken. Beide kisten staan los van de kramen. De indeling migreert huidige saves en checkpoints zonder geopende kisten opnieuw te maken of voorraad te herstellen. Alleen een speler buiten de vernieuwde trapvloer krijgt de dichtstbijzijnde vrije grondpositie. Drie regressiechecks lopen met gewone acht-richtingeninvoer naar alle handelaren en kisten, controleren hoofdrouteafstand en migratie.

De vloertracering van 5.4.2 volgt beide zichtbare trappen en de volledige tuinterrasvloer in wereldpixels. Een extra aansluiting op de hoofdweg neemt de oude rechthoekige afsluiting boven de rechter trap weg. De nieuwe regressiecheck gebruikt vaste toetsencombinaties op zes zichtbare ingangen, heen en terug, zonder `findPath`.

## Verspreide handelsposten

`HUB_LAYOUTS` legt alle vijftien poorten, twaalf diensten, acht kisten en extra vloeren vast in wereldpixels. De schilderingen hebben nu meer toegankelijke zijwegen, steigers en platforms; de wereldcanvasmaat blijft gelijk. Bestemmingen staan vast en hun verhaalblokkades werken onafhankelijk van plaatsing. Poorten liggen minstens 310 wereldpixels uiteen en vormen per post geen rechte rij. Iedere poort heeft lichaamsruimte en afstand tot kisten en kramen, zodat F de juiste actie selecteert. Bestemmingsnamen staan ook buiten de interactieafstand boven de poort.

De nieuwe checks meten extra loopruimte en gespreide poorten, lopen met gewone acht-richtingentoetsen naar iedere poort en alle diensten en kisten, en controleren de echte interactie en bestemming. Het loopplan reserveert extra lichaamsruimte en bereikt bochten voordat het draait. De zes vaste handmatige trapaanlopen van 5.4.2 blijven daarnaast behouden.


## Overleven, gif en bergingen

Verband geneest maximaal 45 HP met tien seconden cooldown en verwijdert gif niet. De timer blijft bewaard bij reizen, opslaan en herladen en staat zichtbaar op de knop. Antidoten kosten 45 schroot, iedere post heeft twee doses en de rugzaklimiet is drie. Gebruik heeft dertig seconden cooldown en vijf seconden gifbescherming. Antidoten herstellen geen HP.

Een infectie doet acht schadeticks in acht seconden, samen 50% van de maximale HP bij besmetting. Nieuwe treffers verversen de duur en bewaren een gedeeltelijke tick; de DPS stapelt niet. Armor, tijdelijke wards of dash-onkwetsbaarheid verwijderen bestaand gif niet. De directe treffer blijft apart door normale bescherming gereduceerd worden. Een treffer vanuit vol leven is zo pijnlijk, maar niet onmiddellijk fataal. De HUD noemt schade per seconde en resterende tijd; giftige vijanden krijgen een tekstlabel.

Spuitkevers wisselen drie langzame gifprojectielen en één aangekondigde grote gifplas af. Gifmeesters wisselen een vastgerichte smalle straal en drie kleinere gifplassen af. Sporenwerpers wisselen hun krateraanval en een gifwaaier af; Kiemhart-zaadprojectielen kunnen besmetten. Waarschuwingen duren minimaal 1,15 seconde. Plassen blijven na hun aanvullende armfase drie seconden actief.

De Schrootgetijden en het Vergeten Depot hebben eigen geschilderde vloeren en twee groepen. Alleen volledige overwinning opent de terugpoort en betaalt 35/55 extra schroot en één buitkist. Opnieuw betreden na voltooiing maakt een nieuwe, op actueel level geschaalde berging; een lopende poging blijft bij reload intact. Reizen geeft geen HP of mana. De beloning van de optionele elite telt niet mee als gegarandeerde grote campagne-drop. De zestien hoofdstukken en hun kernvereisten blijven intact.

## Lootloten

Jules biedt een derde winkeltab met zes expliciete slotkeuzes. Prijs: 40 + 10 × level schroot. Rarityverdeling: Common 40%, Uncommon 36%, Rare 18%, Epic 5%, Legendary 1%. Itemlevel: minimaal 1, verder spelerslevel minus 1. Geld, item, vorige uitslag en toevalsreeks worden opgeslagen; handelen legt het resultaat in het checkpoint vast. Geen geld of een volle rugzak verandert niets en gebruikt geen RNG. Het gerolde item gaat alleen in de rugzak en wordt nooit automatisch uitgerust.

## Transportnet en Noodstroom

Drie extra vloertraceringen openen het noordelijke tuinpad, het zuidelijke zijplein en de westelijke markttak. Een brede aansluiting koppelt het tuinpad aan de weg. Alle geldige 24-pixel-loopgridpunten in Transportnet moeten tot dezelfde verbonden component horen; echte acht-richtingentoetsen bereiken de NPC en de zijpleinen. De verborgen voorraadkist staat op het zuidelijke zijplein.

Nora biedt één optionele bergingsquest. Aanvaarding is expliciet en verandert geen hoofdstuk, kern of hoofdroute. Na beide groepen in het Vergeten Depot verschijnt een aparte meetspoel; F bergt deze zonder rugzakslot. Terug bij Nora kiest de speler één vooraf gerold zeldzaam wapen, laarzen of reliek en ontvangt 80 schroot. Een volle rugzak blokkeert alleen het inleveren; de beloning blijft bewaard. Status en keuzelijst worden opgeslagen en opgenomen in checkpoints. Claim betaalt eenmaal en rust geen gear automatisch uit.

## Elementaanvallen en loopcontact

De nieuwe transparante effectatlas heeft per element twee vluchtbeelden, een impact en verspreiding. Alpha-uitsneden verwijderen alleen lege marges zodat details ook op speelschaal leesbaar zijn. Aanvallen hebben een element, laadgloed bij de mond/het wapen, gerichte terugslag of uitstoot en een bijpassende impact. Projectielwaaiers behouden hun spreiding maar richten hun middenlijn vanuit de monding op het vastgezette lichaamsdoel. Water maakt nat; storm behoudt extra schade op natte doelen. Gif houdt zijn bestaande regels.

Snipe is een snelle kogel met echte vlucht en botsing. Sporen, belegeringskogels en meteoren vliegen in een boog naar de vastgezette landing; pas daar volgt schade. Waarschuwingen blijven tijdens de vlucht zichtbaar. Gifplas-, mijn- en vuurkraterdragers hebben alleen een visuele functie; de bestaande vertraagde collider blijft de enige schadebron. Waterringen, draaiende stralen en trekstromen dragen elementart.

Een loopcyclus beslaat 72 wereldpixels. Beide voeten staan tijdens contact onder de heupen, bewegen 18 pixels voor/achter en komen tijdens de terughaalpas los. Het contact schuift relatief achteruit met dezelfde snelheid als de verplaatsing, ook op de isometrische Y-as. Voorwaartse romphelling, verschuiving en contrarotatie maken de pas actiever; de stafgloed gebruikt dezelfde transform.
