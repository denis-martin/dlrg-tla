DlrgTlaApp.controller('ImportCtrl', function ($scope)
{
	$scope.csv = "";
	$scope.importType = "participants";
	$scope.importedCount = 0;
	$scope.failedCount = 0;

	$scope.import = function()
	{
		if (this.importType == "participants") {
			this.importParticipants();

		} else if (this.importType == "registrations") {
			this.importRegistrations();

		} else if (this.importType == "qualifications") {
			this.importQualifications();
		}
	}

	$scope.guessDate = function(s)
	{
		if (s.length == 8) { // 01.01.01
			var date = s.substr(6, 2);
			date = (date[0] == "9") ? "19" + date : "20" + date;
			date = date + "-" + s.substr(3, 2) + "-" + s.substr(0, 2);
			return date;

		} else if (s.length == 10) { // 01.01.2001
			var date = s.substr(6, 4);
			date = date + "-" + s.substr(3, 2) + "-" + s.substr(0, 2);
			return date;

		}
		return null;
	}

	// 0 "PersNr"
	// 1 "Anrede"
	// 2 "Name"
	// 3 "Vorname"
	// 4 "Geburtsdatum"
	// 5 "Straße"
	// 6 "PLZ"
	// 7 "Ort"
	// 8 "TelefonVorwahl"
	// 9 "TelefonDruchwahl"
	// 10 "TelefonGeschaeft"
	// 11 "Handy"
	// 12 "Email"
	// 13 "Email 2"
	// 14 "Gesundheitsangabe"
	// 15 "Mitgliedschaft"
	// 16 "Verwandschaft"
	// 17 "Kleidergröße"
	$scope.importParticipants = function()
	{
		console.log("importParticipants");
		this.importedCount = 0;	
		this.thinking = true;
		if (this.csv) {
			var data = Papa.parse(this.csv);
			console.log(data);
			data.data.forEach(function(v, i) {
				if (i > 0) {
					var p = { 
						data: {
							"sex": v[1]=="Herr" ? "m" : (v[1]=="Frau" ? "w" : null),
							"lastName": v[2],
							"firstName": v[3],
							"birthdate": v[4] ? v[4].substr(6, 4)+"-"+v[4].substr(3, 2)+"-"+v[4].substr(0, 2) : null,
							"street": v[5] ? v[5] : null,
							"zipCode": v[6] ? v[6] : null,
							"city": v[7] ? v[7] : null,
							"phone": v[8] ? v[8] + " / " + v[9] : v[9],
							"phoneWork": v[10] ? v[10] : null,
							"phoneMobile": v[11] ? v[11] : null,
							"email": v[12] ? v[12] : null,
							"altEmail": v[13] ? v[13] : null,
							"health": v[14] ? v[14] : null,
							"membership": v[15] ? 1 : 0,
							"relationId": (v[16] && parseInt(v[16])!=parseInt(v[0])) ? parseInt(v[16]) : null,
							"dressSize": v[17] ? v[17] : null
						}
					}
					DlrgTla.importEntry("participants", v[0], p, 
						function() { this.importedCount++ },
						function() { this.failedCount++ });
				}
			});
		}
		delete this.thinking;
	}

	// 0 WKurswahl
	// 1 KursbelegungPlan
	// 2 WAnmeldedatum
	// 3 WWunsch
	// 4 WBemerkung
	// 5 Warezeit
	// 6 Name
	// 7 Vorname
	// 8 Geburtsdatum
	// 9 Alter
	// 10 Email
	// 11 Straße
	// 12 PLZ
	// 13 Ort
	// 14 TelefonVorwahl
	// 15 TelefonDruchwahl
	// 16 TelefonGeschaeft
	// 17 Handy
	// 18 Gesundheitsangabe
	// 19 Mitgliedschaft
	// 20 Kursbelegung
	// 21 Verwandschaft
	// 22 PersNr
	// ...
	$scope.importRegistrations = function()
	{
		console.log("importRegistrations");
		$scope.importedCount = 0;	
		this.thinking = true;
		if (this.csv) {
			var data = Papa.parse(this.csv);
			console.log(data);
			data.data.forEach(function(v, i) {
				if (i > 0) {
					var pId = parseInt(v[22]);
					var p = DlrgTla.getEntry("participants", pId);
					if (p) {
						var r = {
							ctId: parseInt(v[0])+1,
							pId: pId,
							data: {
								date: v[2] ? v[2].substr(6, 4)+"-"+v[2].substr(3, 2)+"-"+v[2].substr(0, 2) : null,
								request: v[3] ? v[3] : null,
								notes: v[4] ? v[4] : null
							}
						}
						DlrgTla.importEntry("registrations", null, r, 
							function() { $scope.importedCount++ },
							function() { $scope.failedCount++ });

					} else {
						console.log("importRegistrations: Skipping", pId);
					}
				}
			});
		}
		delete this.thinking;
	}

	$scope.importQualifications = function()
	{
		console.log("importQualifications");
		$scope.importedCount = 0;
		this.thinking = true;
		if (this.csv) {
			var data = Papa.parse(this.csv);
			console.log(data);
			data.data.forEach(function(v, i) {
				if (i > 0) {
					var pId = parseInt(v[0]);
					var p = DlrgTla.getEntry("participants", pId);
					if (p) {
						// 1	Seepferdchen	1
						if (v[1]) {
							var date = $scope.guessDate(v[1]);
							var notes = (date==null) ? v[1] : null;
							var r = {
								qtId: 1,
								pId: pId,
								data: {
									date: date,
									notes: notes,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 2	JSBronze	2
						// 3	200mStrecke	
						if (v[2]) {
							var date = $scope.guessDate(v[2]);
							var notes = (date==null) ? v[2] : null;
							if (v[3]) {
								notes = notes ? (notes + ", ") : "";
								notes = notes + "200m: " + v[3];
							}
							var r = {
								qtId: 2,
								pId: pId,
								data: {
									date: date,
									notes: notes,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}
						
						// 4	JSSilber	3
						// 5	400mStecke	
						if (v[4]) {
							var date = $scope.guessDate(v[4]);
							var notes = (date==null) ? v[4] : null;
							if (v[5]) {
								notes = notes ? (notes + ", ") : "";
								notes = notes + "400m: " + v[5];
							}
							var r = {
								qtId: 3,
								pId: pId,
								data: {
									date: date,
									notes: notes,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 6	JSGold	4
						// 7	600mStrecke	
						// 8	50m_Brustschwimmen	
						if (v[6]) {
							var date = $scope.guessDate(v[6]);
							var notes = (date==null) ? v[6] : null;
							if (v[7]) {
								notes = notes ? (notes + ", ") : "";
								notes = notes + "600m: " + v[7];
							}
							if (v[8]) {
								notes = notes ? (notes + ", ") : "";
								notes = notes + "50m Brustschwimmen: " + v[8];
							}
							var r = {
								qtId: 4,
								pId: pId,
								data: {
									date: date,
									notes: notes,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 9	Juniorretter	5
						// 10	RegNrJuniorretter	
						// 11	PrueferJR	
						if (v[9] || v[10]) {
							var date = $scope.guessDate(v[9]);
							var notes = (date==null) ? v[9] : null;
							var r = {
								qtId: 5,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[10] ? v[10] : null,
									examiner: v[11] ? v[11] : null,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 12	RSABronze	6
						// 13	RegNrRSABronze	
						// 14	WiederholungRSABronze	
						// 15	PrueferRSABronze	
						// 16	AnzahlWdRSABronze	
						if (v[12] || v[13]) {
							var date = $scope.guessDate(v[12]);
							var notes = (date==null) ? v[12] : null;
							var renewalDate = $scope.guessDate(v[14]);
							if (!renewalDate && v[14]) {
								notes = notes ? (notes + ", ") : "";
								notes = notes + "Wdh: " + v[14];
							}
							var r = {
								qtId: 6,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[13] ? v[13] : null,
									examiner: v[15] ? v[15] : null,
									renewalDate: renewalDate,
									renewalCount: v[16] ? parseInt(v[16]) : 0,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 17	RSASilber	7
						// 18	RegNrRSASilber	
						// 19	PrueferRSASilber	
						// 20	WiederholungRSASilber	
						// 21	AnzahlWdRSASilber	
						if (v[17] || v[18]) {
							var date = $scope.guessDate(v[17]);
							var notes = (date==null) ? v[17] : null;
							var renewalDate = $scope.guessDate(v[20]);
							if (!renewalDate && v[20]) {
								notes = notes ? (notes + ", ") : "";
								notes = notes + "Wdh: " + v[20];
							}
							var r = {
								qtId: 7,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[18] ? v[18] : null,
									examiner: v[19] ? v[19] : null,
									renewalDate: renewalDate,
									renewalCount: v[21] ? parseInt(v[21]) : 0,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 22	RSAGold	8
						// 23	RegNrRSAGold	
						// 24	PrueferRSAGold	
						// 25	WiederholungRSAGold	
						// 26	AnzahlWdRSAGold	
						if (v[22] || v[23]) {
							var date = $scope.guessDate(v[22]);
							var notes = (date==null) ? v[22] : null;
							var renewalDate = $scope.guessDate(v[25]);
							if (!renewalDate && v[25]) {
								notes = notes ? (notes + ", ") : "";
								notes = notes + "Wdh: " + v[25];
							}
							var r = {
								qtId: 8,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[23] ? v[23] : null,
									examiner: v[24] ? v[24] : null,
									renewalDate: renewalDate,
									renewalCount: v[26] ? parseInt(v[26]) : 0,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 27	Schnorcheltauchen	9
						// 28	RegNrSchnorcheltauchen	
						// 29	PrueferSchnorcheltauchen	
						if (v[27] || v[28]) {
							var date = $scope.guessDate(v[27]);
							var notes = (date==null) ? v[27] : null;
							var r = {
								qtId: 9,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[28] ? v[28] : null,
									examiner: v[29] ? v[29] : null,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 30	EHTraining	12
						// 31	RegNrEHTraining	
						if (v[30] || v[31]) {
							var date = $scope.guessDate(v[30]);
							var notes = (date==null) ? v[30] : null;
							var r = {
								qtId: 12,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[31] ? v[31] : null,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 32	EHKurs8UE	10
						// 33	RegNrEHKurs8UE	
						if (v[32] || v[33]) {
							var date = $scope.guessDate(v[32]);
							var notes = (date==null) ? v[32] : null;
							var r = {
								qtId: 10,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[33] ? v[33] : null,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 34	EHKurs16UE	11
						// 35	RegNrEHKurs16UE	
						if (v[34] || v[35]) {
							var date = $scope.guessDate(v[34]);
							var notes = (date==null) ? v[34] : null;
							var r = {
								qtId: 11,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[35] ? v[35] : null,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 36	AED-Anwender (323)	13
						// 37	RegNrAED	
						// 38	RegNrAEDWd	
						if (v[36] || v[37]) {
							var date = $scope.guessDate(v[36]);
							var notes = (date==null) ? v[36] : null;
							var r = {
								qtId: 13,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[37] ? v[37] : null,
									renewalRegno: v[38] ? v[38] : null,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 39	SanA (331)	14
						// 40	RegNrSanA	
						if (v[39] || v[40]) {
							var date = $scope.guessDate(v[39]);
							var notes = (date==null) ? v[39] : null;
							var r = {
								qtId: 14,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[40] ? v[40] : null,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 41	SanB (332)	15
						// 42	RegNrSanB	
						if (v[41] || v[42]) {
							var date = $scope.guessDate(v[41]);
							var notes = (date==null) ? v[41] : null;
							var r = {
								qtId: 15,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[42] ? v[42] : null,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 51	Prüfernummer	26
						// 52	Ausbilder seit	
						if (v[51] || v[52]) {
							var r = {
								qtId: 26,
								pId: pId,
								data: {
									notes: v[52] ? "seit " + v[52] : null,
									regno: v[51] ? v[51] : null,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 56	VAAVorbereitung AusbildungsAssistent	16
						if (v[56]) {
							var r = {
								qtId: 16,
								pId: pId,
								data: {
									date: $scope.guessDate(v[56]),
									notes: (date==null) ? v[56] : null,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 57	RegNrAASchwimmen	
						// 58	AASchwimmen (171)	17
						if (v[58] || v[57]) {
							var date = $scope.guessDate(v[58]);
							var notes = (date==null) ? v[58] : null;
							var r = {
								qtId: 17,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[57] ? v[57] : null,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 59	RegNrAARettungsschwimmen	
						// 60	AARettungsschwimmenm (172)	18
						if (v[60] || v[59]) {
							var date = $scope.guessDate(v[60]);
							var notes = (date==null) ? v[60] : null;
							var r = {
								qtId: 18,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[59] ? v[59] : null,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 65	Ausbilder Schwimmen (182)	20
						// 66	RegNrAusbilder Schwimmen	
						// 67	ASGueltigkeit	
						// (keine Einträge)

						// 68	Ausbilder Rettungsschwimmen (183)	21
						// 69	RegNrAusbilder Rettungsschwimmen	
						// 70	ARGueltigkeit	
						// (keine Einträge)
						
						// 71	Lehrschein (181)	19
						// 72	RegNr Lehrschein	
						// 73	Lehrscheinverlaengerung	
						if (v[71] || v[72]) {
							var date = $scope.guessDate(v[71]);
							var notes = (date==null) ? v[71] : null;
							var expiryDate = $scope.guessDate(v[73]);
							if (!expiryDate && v[73]) {
								notes = notes ? (notes + ", ") : "";
								notes = notes + "gültig bis: " + v[73];
							}
							var r = {
								qtId: 19,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[72] ? v[72] : null,
									expiryDate: expiryDate,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 74	EHAusbilder	22
						// 75	EHAusbilderverlängerung	
						// 76	RegNr EHAusbilder	
						if (v[74] || v[76]) {
							var date = $scope.guessDate(v[74]);
							var notes = (date==null) ? v[74] : null;
							var expiryDate = $scope.guessDate(v[75]);
							if (!expiryDate && v[75]) {
								notes = notes ? (notes + ", ") : "";
								notes = notes + "gültig bis: " + v[75];
							}
							var r = {
								qtId: 22,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[76] ? v[76] : null,
									expiryDate: expiryDate,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 77	AEDAusbilder	23
						// 78	AEDAusbilderverlängerung	
						// 79	RegNr AEDAusbilder	
						if (v[77] || v[79]) {
							var date = $scope.guessDate(v[77]);
							var notes = (date==null) ? v[77] : null;
							var expiryDate = $scope.guessDate(v[78]);
							if (!expiryDate && v[78]) {
								notes = notes ? (notes + ", ") : "";
								notes = notes + "gültig bis: " + v[78];
							}
							var r = {
								qtId: 23,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[79] ? v[79] : null,
									expiryDate: expiryDate,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 80	Sprechfunkunterweisung (707)	24
						if (v[80]) {
							var r = {
								qtId: 24,
								pId: pId,
								data: {
									date: $scope.guessDate(v[80]),
									notes: (date==null) ? v[80] : null,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

						// 81	Fachausbildung WRD (411)	25
						// 82	RegNr Fachausbildung WRD	
						if (v[81] || v[82]) {
							var date = $scope.guessDate(v[81]);
							var notes = (date==null) ? v[81] : null;
							var r = {
								qtId: 25,
								pId: pId,
								data: {
									date: date,
									notes: notes,
									regno: v[82] ? v[82] : null,
								}
							}
							DlrgTla.importEntry("qualifications", null, r, function() { $scope.importedCount++ }, function() { $scope.failedCount++ });
						}

					} else {
						console.log("importQualifications: Skipping", pId);
					}
				}
			});
		}
		delete this.thinking;
	}

});
