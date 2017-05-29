let app = new Vue({
	el: '#app',
	data: {//inicijalizacija na promenlivi koi se koristat globalno vklucuvajki i HTML dokumentot
		cekor: 0,
		maxCekor: 6,
		sledenDisabled: null,
		simboli:['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
		verojatnosti: new Array(8),
		fiksniVerojatnosti: [0.05, 0.15, 0.14, 0.16, 0.16, 0.14, 0.15, 0.05],
		sumaP: 0,
		vlez: '',
		kodTabVerojatnosti: Create2DArray(7),
		kodTabSimboli: Create2DArray(7),
		kodnaDolzina: 0,
		entropija: 0,
		kodovi: new Array(8).join(".").split("."),
		kodiranVlez: '',
		dekodiranIzlez: ''
	},
	methods: {
		fiksniVrednosti: function (){
			//metod za dodeluvanje na pre-definirani vrednosti kako verojatnosti
			this.verojatnosti = this.fiksniVerojatnosti;
		},
		generirajVerojatnosti: function (){
				//metod koj pravi kombinacii od random Gaus(menian 0.5) broevi se dodeka nivniot zbir ne iznesuva 1
				var tmpVer = Create2DArray(7);
				while(tmpVer.sum() != 1){
					for (var i = this.simboli.length - 1; i >= 0; i--) {
						tmpVer[i] = getGaussianRandNum();
					}
				}
				//dobieni se baranite verojatnosti, gi smestuvame vo glavnata niza so koja rabotime
				this.verojatnosti = tmpVer;
		},
		generirajVlez: function (){
			this.vlez = '';
			//napolni ja nizata spored verojatnostite za pojavuvanje
			//izmesaj ja nizata
			let pozNiza = 0;
			let i = 0;
			while(pozNiza != 8){
			  if (this.fiksniVerojatnosti[pozNiza]*2048 > i+1) {
			  	i++;
			  	this.vlez+=this.simboli[pozNiza];
			  }else{
			  	pozNiza ++;
			  	i = 0;
			  }
			}
			if (pozNiza == 8 && this.vlez.length < 2048) {
				let razlika = 2048 - this.vlez.length;
			  	for (var j = 0; j < razlika; j++) {
			  		this.vlez+=this.simboli[pozNiza-1];
			  	}
			}
			this.vlez = this.vlez.shuffle();
			//console.log(this.vlez.length);
		},
		nazad: function (){//pomosen metod za wizard
			(this.cekor > 0) ? this.cekor--: null;
			this.sledenDisabled = null;
		},
		napred: function (){//pomosen metod za wizard
			(this.cekor < this.maxCekor && this.sledenDisabled != 'disabled') ? this.cekor ++: this.sledenDisabled = 'disabled';
			if ((this.cekor == 1 && this.sumaP != 1) || (this.cekor == 2 && this.vlez == '') || (this.cekor == this.maxCekor)){
				this.sledenDisabled = 'disabled';
			}
			if (this.cekor == 4) {
				this.kodirajDekodiraj();
			}
		},
		kodnaZamena: function (){//ovoj metod gi generira tabelite za prikaz kako raboti algoritamot, se koristat dve dvodimenzionalni matrici, ednata za karakterite a drugata za cuvanje na verojatnostite. Red od matricata e edna tabela
			this.kodTabSimboli[0] = this.simboli.slice();
			this.kodTabVerojatnosti[0] = this.verojatnosti.slice();
			this.sortiraj(this.kodTabSimboli[0], this.kodTabVerojatnosti[0]);
			for (var i = 1; i < this.verojatnosti.length - 1; i++) {
				for (var j = 0; j < this.kodTabVerojatnosti[i-1].length - 2; j++) {
					this.kodTabVerojatnosti[i][j] = this.kodTabVerojatnosti[i-1][j];
					this.kodTabSimboli[i][j] = this.kodTabSimboli[i-1][j];
				}
				this.kodTabVerojatnosti[i][this.kodTabVerojatnosti[i-1].length-2] = this.kodTabVerojatnosti[i-1][this.kodTabVerojatnosti[i-1].length - 1] + this.kodTabVerojatnosti[i-1][this.kodTabVerojatnosti[i-1].length - 2];
				this.kodTabSimboli[i][this.kodTabSimboli[i-1].length-2] = this.kodTabSimboli[i-1][this.kodTabSimboli[i-1].length - 1] + this.kodTabSimboli[i-1][this.kodTabSimboli[i-1].length - 2];
				this.sortiraj(this.kodTabSimboli[i], this.kodTabVerojatnosti[i]);
			}
			//console.log(this.kodTabVerojatnosti);
			//console.log(this.kodTabSimboli);
			this.popolniKodnaNiza();
			this.presmetajHK();
		},
		sortiraj: function (simboliTmp, verojatnostiTmp){//ovoj metod gi sortira verojatnostite po opagacki redosled i istovremeno go menuva i redosleded na simbolite taka da soodvestuvaat na verojatnostite
		    var swapped;
		    do {
		        swapped = false;
		        for (var i=0; i < verojatnostiTmp.length-1; i++) {
		            if (verojatnostiTmp[i] < verojatnostiTmp[i+1]) {
		                var temp = verojatnostiTmp[i];
		                verojatnostiTmp[i] = verojatnostiTmp[i+1];
		                verojatnostiTmp[i+1] = temp;
		                var temp2 = simboliTmp[i];
		                simboliTmp[i] = simboliTmp[i+1];
		                simboliTmp[i+1] = temp2;
		                swapped = true;
		            }
		        }
		    } while (swapped);
		},
		presmetajHK: function (){//ovoj metod sluzi za presmetka na entropijata i prosecna kodna dolzina na algoritamot
			this.entropija = 0;
			this.kodnaDolzina = 0;
			for (var i = this.verojatnosti.length - 1; i >= 0; i--) {
				this.entropija += -this.verojatnosti[i]*Math.log2(this.verojatnosti[i]);
				//console.log(this.kodovi[i].length);
				this.kodnaDolzina += this.verojatnosti[i]*this.kodovi[i].length;
			}
		},
		popolniKodnaNiza: function (){//ovoj metod iterira niz prethodno dobienite tabeli i ja pravi kodnata tabela(this.kodovi)
			this.kodovi = new Array(8).join(".").split(".");
			for (var i = this.kodTabSimboli.length - 1; i >= 0; i--) {
				for (var j = this.kodTabSimboli[i].length - 1; j >= this.kodTabSimboli[i].length - 2; j--) {
					if (j == (this.kodTabSimboli[i].length - 1)) {
						//dodaj 1
						for (var x = 0; x < this.kodTabSimboli[i][j].length; x++)
						{
							this.kodovi[this.simboli.indexOf(this.kodTabSimboli[i][j].charAt(x))] += '1';
						}
					}else{
						//dodaj 0
						for (var x = 0; x < this.kodTabSimboli[i][j].length; x++)
						{
							this.kodovi[this.simboli.indexOf(this.kodTabSimboli[i][j].charAt(x))] += '0';
						}
					}
					//console.log(this.kodTabSimboli[i][j].length);
				}
			}
		},
		kodirajDekodiraj: function (){//ovoj metod go kodira vlezot i potoa istiot go dekodira koristejki ja kodnata tabela
			//kodiraj
			this.kodiranVlez = this.vlez.slice();
			for (var i = this.simboli.length - 1; i >= 0; i--) {
				this.kodiranVlez = this.kodiranVlez.replace(RegExp(this.simboli[i], "g"), this.kodovi[i]);
			}
			//dekodiraj
			this.dekodiranIzlez = '';
			var tmp = '';
			for (var i = 0; i < this.kodiranVlez.length ; i++) {
				tmp += this.kodiranVlez.charAt(i);
				if (this.kodovi.indexOf(tmp) > -1) {
					//console.log(tmp);
					this.dekodiranIzlez += this.simboli[this.kodovi.indexOf(tmp)];
					tmp = '';
				}
			}
		},
		vlezBiti: function (){//sluzi za vrakjane na broj na bitovi od nekompresiraniot vlez
			//console.log(text2Binary(this.vlez));
			return text2Binary(this.vlez).length;
		}
	},
	mounted: function (){
		//this.generirajVerojatnosti();
	},
	watch: {
    	verojatnosti: function () {//ovoj metod pravi presmetka na suma na verojatnosti pri sekoja promena
    		this.sumaP = this.verojatnosti.sum();
    		if (this.cekor == 1 && this.sumaP == 1){
				this.sledenDisabled = null;
			}else{
				this.sledenDisabled = 'disabled';
			}
			this.kodnaZamena();
    	},
    	vlez: function () {//sluzi za kontrola na kopceto napred, zavisno od toa dali ima generirano vlez
    		if (this.cekor == 2 && this.vlez != '') {
    			this.sledenDisabled = null;
    		}else{
    			this.sledenDisabled = 'disabled';
    		}
    	}
  }
});

String.prototype.shuffle = function () {//pomosen prototip metod
    var a = this.split(""),
        n = a.length;

    for(var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
}

Array.prototype.sum = Array.prototype.sum || function() {//pomosen prototip metod
  return this.reduce(function(sum, a) { return sum + Number(a) }, 0);
}

function Create2DArray(rows) {
  var arr = [];

  for (var i=0;i<rows;i++) {
     arr[i] = [];
  }

  return arr;
}

function getGaussianRandNum(){//ovoj metod ja koristi bibliotekata numbers.js za generiranje na random normalni borevi so mediana 0.5
	var num = numbers.random.distribution.normal(1, 0.5)[0].toFixed(2);
	while((num<=0) || (num>0.5)){
		num = numbers.random.distribution.normal(1, 0.5)[0].toFixed(2);
	}
	return parseFloat(num);
}

function text2Binary(string) {//ovoj metod ni pretvara string vo bitovi
    return string.split('').map(function (char) {
        return char.charCodeAt(0).toString(2);
    }).join();
}