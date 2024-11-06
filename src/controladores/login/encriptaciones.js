const bcrypt = require('bcrypt');
const express = require('express');
const conectarBD = require('../../bd/db.js')
const iconv = require('iconv-lite');

let code = []
const encriptar = express.Router();
const encriptado = encriptar.use(async (req, res)=>{
    this.codigos();
    const str = iconv.decode(Buffer.from([0x68, 0x65, 0x6c, 0x6c, 0x6f]), 'win1251')
    const pass = req.body.pass;
    const pool = await conectarBD();
    //PARA GUARDAR LA CONTRASEÑA
    const salt = await bcrypt.genSaltSync(10);
    const hash = await bcrypt.hashSync('admin123', salt);


    //PARA SACAR LA CONTRASEÑA ENCRIPTADA GUARDAD DE LA BD
    const result = await pool.request().query('use spvnet3; '+
    " select bpass from usuarios where usuarioid = 18 ");
    const datosUsuarios = await pool.request()
    .query("use spvnet3; select * from usuarios");
    
    //console.log(datosUsuarios.recordsets[0]);
    let usuarioids = [];
    let usuariopass = [];
    let cont = 0;
    datosUsuarios.recordsets[0].forEach(datos=>{
        usuarioids.push(datos['usuarioId']);
        usuariopass.push(datos['password']);

        //console.log(desComprime(usuariopass[cont]));
        cont++;
    });
    const da = "ˆ"
    //Convierte a caracter


    //CAQUI EN VEZ DE ADMIN123 ES EL REQ.BODY.PASS
    const verdad = await bcrypt.compare('admin123', result.recordsets[0][0].bpass);
    return res.json({salt: salt, hash: hash});
})
module.exports = encriptado;

const encripta = (Dato) =>{
    let intLetras = Dato.length;
    let letra = '';
    let s = '';
    let intLlave = 0;
    let j = 0;
    let nueva = '';
    for (let i = 1; i <= intLetras; i++) {
      letra = Dato.substr(i - 1, 1);
      if (i <= 11) {
        j = letra.charCodeAt(0) + (intLlave + i) * (i);
        nueva = String.fromCharCode(j);
        nueva = this.code[j - 1];
        s = s + nueva;
      }
      else {
        j = letra.charCodeAt(0) + (intLlave + i) * (1);
        nueva = String.fromCharCode(j);
        nueva = this.code[j - 1];
        s = s + nueva;
      }
    }
    return s;
  }

const codigos = () => {
    for (let i = 1; i <= 255; i++) {
      this.code.push('');
    }
    code[1] = ""
    code[2] = ""
    code[3] = ""
    code[4] = ""
    code[5] = ""
    code[6] = ""
    code[7] = ""
    code[8] = ""
    code[9] = " "
    code[10] = " "
    code[11] = ""
    code[12] = ""
    code[13] = " "
    code[14] = ""
    code[15] = ""
    code[16] = ""
    code[17] = ""
    code[18] = ""
    code[19] = ""
    code[20] = ""
    code[21] = ""
    code[22] = ""
    code[23] = ""
    code[24] = ""
    code[25] = ""
    code[26] = ""
    code[27] = ""
    code[28] = ""
    code[29] = ""
    code[30] = ""
    code[31] = ""
    code[32] = " "
    code[33] = "!"
    code[34] = "#"
    code[35] = "$"
    code[36] = "%"
    code[37] = "&"
    code[38] = "'"
    code[39] = "("
    code[40] = ")"
    code[41] = "*"
    code[42] = "+"
    code[43] = ","
    code[44] = "-"
    code[45] = "."
    code[46] = "/"
    code[47] = "0"
    code[48] = "1"
    code[49] = "2"
    code[50] = "3"
    code[51] = "4"
    code[52] = "5"
    code[53] = "6"
    code[54] = "7"
    code[55] = "8"
    code[56] = "9"
    code[57] = ":"
    code[58] = ";"
    code[59] = "<"
    code[60] = "="
    code[61] = ">"
    code[62] = "?"
    code[63] = "@"
    code[64] = "A"
    code[65] = "B"
    code[66] = "C"
    code[67] = "D"
    code[68] = "E"
    code[69] = "F"
    code[70] = "G"
    code[71] = "H"
    code[72] = "I"
    code[73] = "J"
    code[74] = "K"
    code[75] = "L"
    code[76] = "M"
    code[77] = "N"
    code[78] = "O"
    code[79] = "P"
    code[80] = "Q"
    code[81] = "R"
    code[82] = "S"
    code[83] = "T"
    code[84] = "U"
    code[85] = "V"
    code[86] = "W"
    code[87] = "X"
    code[88] = "Y"
    code[89] = "Z"
    code[90] = "["
    code[91] = "\\";
    code[92] = "]"
    code[93] = "^"
    code[94] = "_"
    code[95] = "`"
    code[96] = "a"
    code[97] = "b"
    code[98] = "c"
    code[99] = "d"
    code[100] = "e"
    code[101] = "f"
    code[102] = "g"
    code[103] = "h"
    code[104] = "i"
    code[105] = "j"
    code[106] = "k"
    code[107] = "l"
    code[108] = "m"
    code[109] = "n"
    code[110] = "o"
    code[111] = "p"
    code[112] = "q"
    code[113] = "r"
    code[114] = "s"
    code[115] = "t"
    code[116] = "u"
    code[117] = "v"
    code[118] = "w"
    code[119] = "x"
    code[120] = "y"
    code[121] = "z"
    code[122] = "{"
    code[123] = "|"
    code[124] = "}"
    code[125] = "~"
    code[126] = ""
    code[127] = "€"
    code[128] = ""
    code[129] = "‚"
    code[130] = "ƒ"
    code[131] = "„"
    code[132] = "…"
    code[133] = "†"
    code[134] = "‡"
    code[135] = "ˆ"
    code[136] = "‰"
    code[137] = "Š"
    code[138] = "‹"
    code[139] = "Œ"
    code[140] = ""
    code[141] = "Ž"
    code[142] = ""
    code[143] = ""
    code[144] = "‘"
    code[145] = "’"
    code[146] = "“"
    code[147] = "”"
    code[148] = "•"
    code[149] = "–"
    code[150] = "—"
    code[151] = "˜"
    code[152] = "™"
    code[153] = "š"
    code[154] = "›"
    code[155] = "œ"
    code[156] = ""
    code[157] = "ž"
    code[158] = "Ÿ"
    code[159] = " "
    code[160] = "¡"
    code[161] = "¢"
    code[162] = "£"
    code[163] = "¤"
    code[164] = "¥"
    code[165] = "¦"
    code[166] = "§"
    code[167] = "¨"
    code[168] = "©"
    code[169] = "ª"
    code[170] = "«"
    code[171] = "¬"
    code[172] = "­"
    code[173] = "®"
    code[174] = "¯"
    code[175] = "°"
    code[176] = "±"
    code[177] = "²"
    code[178] = "³"
    code[179] = "´"
    code[180] = "µ"
    code[181] = "¶"
    code[182] = "·"
    code[183] = "¸"
    code[184] = "¹"
    code[185] = "º"
    code[186] = "»"
    code[187] = "¼"
    code[188] = "½"
    code[189] = "¾"
    code[190] = "¿"
    code[191] = "À"
    code[192] = "Á"
    code[193] = "Â"
    code[194] = "Ã"
    code[195] = "Ä"
    code[196] = "Å"
    code[197] = "Æ"
    code[198] = "Ç"
    code[199] = "È"
    code[200] = "É"
    code[201] = "Ê"
    code[202] = "Ë"
    code[203] = "Ì"
    code[204] = "Í"
    code[205] = "Î"
    code[206] = "Ï"
    code[207] = "Ð"
    code[208] = "Ñ"
    code[209] = "Ò"
    code[210] = "Ó"
    code[211] = "Ô"
    code[212] = "Õ"
    code[213] = "Ö"
    code[214] = "×"
    code[215] = "Ø"
    code[216] = "Ù"
    code[217] = "Ú"
    code[218] = "Û"
    code[219] = "Ü"
    code[220] = "Ý"
    code[221] = "Þ"
    code[222] = "ß"
    code[223] = "à"
    code[224] = "á"
    code[225] = "â"
    code[226] = "ã"
    code[227] = "ä"
    code[228] = "å"
    code[229] = "æ"
    code[230] = "ç"
    code[231] = "è"
    code[232] = "é"
    code[233] = "ê"
    code[234] = "ë"
    code[235] = "ì"
    code[236] = "í"
    code[237] = "î"
    code[238] = "ï"
    code[239] = "ð"
    code[240] = "ñ"
    code[241] = "ò"
    code[242] = "ó"
    code[243] = "ô"
    code[244] = "õ"
    code[245] = "ö"
    code[246] = "÷"
    code[247] = "ø"
    code[248] = "ù"
    code[249] = "ú"
    code[250] = "û"
    code[251] = "ü"
    code[252] = "ý"
    code[253] = "þ"
    code[254] = "ÿ"
    code[255] = " ";
  }

const desComprime = (dato) =>{
    const intLetras = dato.Length
    const intLlave = 0
    let s  = ""
    let aux = ""
    const letra = ""
    dato.charCodeAt(intLetras);
    
    /*
    for(let i = 1; i <= intLetras; i++)
    {
        letra = dato.Substring(i - 1, 1)
        if (i <= 11) {
            aux += charCodeAt(letra) - ((intLlave + i) * i)
            s += aux.toString()
        }
        else
        {
            aux += charCodeAt(letra) - ((intLlave + i) * 1)
            s += aux.toString()
        }
    }*/
    return dato
}