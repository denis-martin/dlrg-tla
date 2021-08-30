
DlrgTlaApp.controller('DlgSeasonEditCtrl', function ($scope, $uibModalInstance, $http, obj)
{
	$scope.DlrgTla = DlrgTla;

	$scope.obj = obj;
	if (!$scope.obj) {
		$scope.obj = { 
			begin: (new Date()).toISOString().split("T")[0],
			begin2: (new Date()).toISOString().split("T")[0],
			end: (new Date()).toISOString().split("T")[0],
			data: { dates: {} }
		};
		DlrgTla.resetData($scope.obj, "seasons");
	}
	
	if (obj) {
		$scope.modalTitle = "Saison bearbeiten";
	} else {
		$scope.modalTitle = "Neue Saison erfassen";
	}

	$scope.ok = function () 
	{
		if (!$scope.obj.name) {
			$scope.missing = "Saison-Name";
			return;
		}
		$scope.missing = null;

		DlrgTla.thinking = "Saison wird gespeichert..."
		$scope.commitFailed = false;
		DlrgTla.setDataEnc($scope.obj);

		if ($scope.obj.begin) {
			$scope.obj.begin = new Date($scope.obj.begin).toISOString().split("T")[0];
		}
		if ($scope.obj.begin2) {
			$scope.obj.begin2 = new Date($scope.obj.begin2).toISOString().split("T")[0];
		}
		if ($scope.obj.end) {
			$scope.obj.end = new Date($scope.obj.end).toISOString().split("T")[0];
		}
	
		var body = {};
		angular.forEach($scope.obj, function(v, k) {
			if (!k.startsWith("_") && k != "data") {
				body[k] = v;
			}
		});
		if ($scope.obj.id) {
			$http.put(apiBasePath + "api/db/seasons/" + $scope.obj.id, body).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.changed) {
						$scope.obj.changedAt = response.data.changedAt;
						$scope.obj.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.obj, "seasons", true);
					}
					$uibModalInstance.close('ok');
					console.log("put api/db/seasons success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("put api/db/seasons error", response);
				}
			);
		} else {
			$http.post(apiBasePath + "api/db/seasons", body).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.id) {
						$scope.obj.id = response.data.id;
						$scope.obj.changedAt = response.data.changedAt;
						$scope.obj.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.obj, "seasons", true);
						DlrgTla.db.seasons.push($scope.obj);
						DlrgTla.sId = $scope.obj.id;
					}
					$uibModalInstance.close('ok');
					console.log("post api/db/seasons success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("post api/db/seasons error", response);
				}
			);
		}
	};

	$scope.delete = function () 
	{
		if (confirm("Saison wirklich löschen?")) {
			DlrgTla.thinking = "Saison wird gelöscht..."
			$scope.commitFailed = false;

			$http.delete(apiBasePath + "api/db/seasons/" + $scope.obj.id).then(
				function(response) {
					DlrgTla.thinking = "";
					var pos = DlrgTla.db.seasons.map(e => e.id).indexOf($scope.obj.id);
					DlrgTla.db.seasons.splice(pos, 1);
					if (DlrgTla.sId === $scope.obj.id) {
						var now = new Date();
						for (var i = 0; i < DlrgTla.db.seasons.length; i++) {
							if (now <= DlrgTla.db.seasons[i].getSetEnd()) { // assuming chronological entries
								DlrgTla.sId = DlrgTla.db.seasons[i].id;
								break;
							}
						}
					}
					$uibModalInstance.close('ok');
					console.log("delete api/db/seasons success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("delete api/db/seasons error", response);
				}
			);
		}
	};

	$scope.cancel = function () 
	{
		$uibModalInstance.dismiss('cancel');
	};
}) // DlgSeasonEditCtrl


DlrgTlaApp.controller('DlgSeasonDayEditCtrl', function ($scope, $uibModalInstance, $http, d)
{
	$scope.DlrgTla = DlrgTla;
	$scope.obj = DlrgTla.getSeason();

	$scope.d = d;
	if (!$scope.d) {
		$scope.d = { 
			training: true,
			desc: null,
			date: new Date()
		};
	}
	
	$scope.newd = {
		training: d.training,
		desc: d.desc,
		date: d.date
	};
	
	$scope.modalTitle = "Übungsabend";

	$scope.ok = function () 
	{
		if (!$scope.obj.data) {
			$scope.obj.data = {};
		}

		if (!$scope.obj.data.dates) {
			$scope.obj.data.dates = {};
		}

		if ($scope.newd.desc) {
			$scope.newd.desc = $scope.newd.desc.trim();
		}

		if ($scope.newd.desc || $scope.newd.training) {
			$scope.obj.data.dates[$scope.newd.date.toISOString().split("T")[0]] = {
				desc: $scope.newd.desc,
				training: $scope.newd.training
			}
		} else {
			delete $scope.obj.data.dates[$scope.newd.date.toISOString().split("T")[0]];
		}

		DlrgTla.thinking = "Saison wird gespeichert..."
		$scope.commitFailed = false;
		DlrgTla.setDataEnc($scope.obj);

		if ($scope.obj.begin) {
			$scope.obj.begin = new Date($scope.obj.begin).toISOString().split("T")[0];
		}
		if ($scope.obj.begin2) {
			$scope.obj.begin2 = new Date($scope.obj.begin2).toISOString().split("T")[0];
		}
		if ($scope.obj.end) {
			$scope.obj.end = new Date($scope.obj.end).toISOString().split("T")[0];
		}
	
		var body = {};
		angular.forEach($scope.obj, function(v, k) {
			if (!k.startsWith("_") && k != "data") {
				body[k] = v;
			}
		});
		if ($scope.obj.id) {
			$http.put(apiBasePath + "api/db/seasons/" + $scope.obj.id, body).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.changed) {
						$scope.obj.changedAt = response.data.changedAt;
						$scope.obj.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.obj, "seasons", true);
					}
					$uibModalInstance.close('ok');
					console.log("put api/db/seasons success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("put api/db/seasons error", response);
				}
			);
		} else {
			console.error("Cannot add season day: missing season id");
		}
	};

	$scope.cancel = function () 
	{
		$uibModalInstance.dismiss('cancel');
	};
}) // DlgSeasonDayEditCtrl
