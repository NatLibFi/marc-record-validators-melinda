/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * MARC record validators used in Melinda
 *
 * Copyright (C) 2014-2018 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of marc-record-validators-melinda
 *
 * marc-record-validators-melinda program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * marc-record-validators-melinda is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 */

export const fixture5000 = `
<?xml version="1.0"?>
<zs:searchRetrieveResponse xmlns:zs="http://www.loc.gov/zing/srw/"><zs:version>1.1</zs:version><zs:numberOfRecords>1</zs:numberOfRecords><zs:records><zs:record><zs:recordSchema>info:srw/schema/1/marcxml-v1.1</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
<leader>00639cam a22002057i 4500</leader>
<controlfield tag="001">000005000</controlfield>
<controlfield tag="003">FI-MELINDA</controlfield>
<controlfield tag="005">20150619230414.0</controlfield>
<controlfield tag="008">860627s1984    fi |||||||||||||||||swe||</controlfield>
<datafield tag="035" ind1=" " ind2=" ">
<subfield code="a">(FI-MELINDA)000005000</subfield>
</datafield>
<datafield tag="035" ind1=" " ind2=" ">
<subfield code="a">(FI-MELINDA)000005000</subfield>
</datafield>
<datafield tag="041" ind1="0" ind2=" ">
<subfield code="a">swe</subfield>
</datafield>
<datafield tag="080" ind1=" " ind2=" ">
<subfield code="a">948.5</subfield>
</datafield>
<datafield tag="245" ind1="0" ind2="0">
<subfield code="a">Svensk historiografi :</subfield>
<subfield code="b">ett urval texter fr&#xE5;n Geijer till L&#xF6;nnroth /</subfield>
<subfield code="c">(red.) Torbj&#xF6;rn Norman.</subfield>
</datafield>
<datafield tag="260" ind1=" " ind2=" ">
<subfield code="a">[&#xC5;bo] :</subfield>
<subfield code="b">[&#xC5;bo akademi],</subfield>
<subfield code="c">[1984]</subfield>
</datafield>
<datafield tag="300" ind1=" " ind2=" ">
<subfield code="a">484 sp. :</subfield>
<subfield code="b">ill.</subfield>
</datafield>
<datafield tag="336" ind1=" " ind2=" ">
<subfield code="a">teksti</subfield>
<subfield code="b">txt</subfield>
<subfield code="2">rdacontent</subfield>
</datafield>
<datafield tag="337" ind1=" " ind2=" ">
<subfield code="a">k&#xE4;ytett&#xE4;viss&#xE4; ilman laitetta</subfield>
<subfield code="b">n</subfield>
<subfield code="2">rdamedia</subfield>
</datafield>
<datafield tag="338" ind1=" " ind2=" ">
<subfield code="a">nide</subfield>
<subfield code="b">nc</subfield>
<subfield code="2">rdacarrier</subfield>
</datafield>
<datafield tag="700" ind1="1" ind2=" ">
<subfield code="a">Norman, Torbj&#xF6;rn.</subfield>
</datafield>
</record></zs:recordData><zs:recordPosition>1</zs:recordPosition></zs:record></zs:records></zs:searchRetrieveResponse>
`;
export const fixture9550 = `
<?xml version="1.0"?>
<zs:searchRetrieveResponse xmlns:zs="http://www.loc.gov/zing/srw/"><zs:version>1.1</zs:version><zs:numberOfRecords>1</zs:numberOfRecords><zs:records><zs:record><zs:recordSchema>info:srw/schema/1/marcxml-v1.1</zs:recordSchema><zs:recordPacking>xml</zs:recordPacking><zs:recordData><record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>00802dam a22002657a 4500</leader>
  <controlfield tag="001">000009550</controlfield>
  <controlfield tag="003">FI-MELINDA</controlfield>
  <controlfield tag="005">20091008145858.0</controlfield>
  <controlfield tag="008">850916s1983    xxk|||||||||||||||||eng||</controlfield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">0-19-826668-5</subfield>
  </datafield>
  <datafield tag="035" ind1=" " ind2=" ">
    <subfield code="a">(FI-MELINDA)000009550</subfield>
  </datafield>
  <datafield tag="041" ind1="0" ind2=" ">
    <subfield code="a">eng</subfield>
  </datafield>
  <datafield tag="080" ind1=" " ind2=" ">
    <subfield code="a">248</subfield>
  </datafield>
  <datafield tag="080" ind1=" " ind2=" ">
    <subfield code="a">141.131</subfield>
  </datafield>
  <datafield tag="100" ind1="0" ind2=" ">
    <subfield code="a">Louth, Andrew.</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="4">
    <subfield code="a">The origins of the Christian mystical tradition :</subfield>
    <subfield code="b">from Plato to Denys /</subfield>
    <subfield code="c">Andrew Louth.</subfield>
  </datafield>
  <datafield tag="250" ind1=" " ind2=" ">
    <subfield code="a">Repr.</subfield>
  </datafield>
  <datafield tag="260" ind1=" " ind2=" ">
    <subfield code="a">Oxford :</subfield>
    <subfield code="b">Clarendon Press,</subfield>
    <subfield code="c">1983.</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">xvii, 215 s.</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">First publ. 1981</subfield>
  </datafield>
  <datafield tag="650" ind1=" " ind2="7">
    <subfield code="a">mysticism</subfield>
    <subfield code="x">0030-0600</subfield>
    <subfield code="2">atla</subfield>
  </datafield>
  <datafield tag="650" ind1=" " ind2="7">
    <subfield code="a">mysticism</subfield>
    <subfield code="x">Orthodox Eastern Church</subfield>
    <subfield code="x">0030-0600</subfield>
    <subfield code="2">atla</subfield>
  </datafield>
  <datafield tag="650" ind1=" " ind2="7">
    <subfield code="a">Dionysius Areopagita, Pseudo-</subfield>
    <subfield code="2">atla</subfield>
  </datafield>
  <datafield tag="650" ind1=" " ind2="7">
    <subfield code="a">Platonism</subfield>
    <subfield code="2">atla</subfield>
  </datafield>
  <datafield tag="650" ind1=" " ind2="7">
    <subfield code="a">mysticism</subfield>
    <subfield code="x">comparative studies</subfield>
    <subfield code="2">atla</subfield>
  </datafield>
</record></zs:recordData><zs:recordPosition>1</zs:recordPosition></zs:record></zs:records></zs:searchRetrieveResponse>
`;