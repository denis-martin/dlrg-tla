
DlrgTlaApp.controller('ParticipantsCtrl', ['$scope', '$uibModal', '$timeout', 'uiGridConstants', function ($scope, $uibModal, $timeout, uiGridConstants)
{
	$scope.DlrgTla = DlrgTla;
	$scope.table = "participants";
	$scope.cr = DlrgTla.cr.p; // current participant

	$scope.isActive = function() {
		return DlrgTla.panel == 'participants';
	}

	$scope.gridOptions = {
		enableSorting: true,
		enableFiltering: true,
		enableColumnMenus: false,
		rowHeight: 24,
		enableRowSelection: true,
		enableFullRowSelection: true,
		enableRowHeaderSelection: false,
		multiSelect: false,
		noUnselect: true,
		isRowSelectable: function(row) { return true; },
		columnDefs: [
			{ name: 'ID', field: 'id', type: 'number', width: 40 },
			{ name: 'Nachname', field: 'data.lastName', width: 100, sort: { direction: 'asc', priority: 0 } },
			{ name: 'Vorname', field: 'data.firstName', width: 100, sort: { direction: 'asc', priority: 1 } },
			{ name: 'Alter', field: 'data.birthdate', width: 45, cellFilter: 'age', filterCellFiltered: true, sortCellFiltered: true,
				sortingAlgorithm: function(a, b) { return a==b? 0 : ((a<b)? -1 : 1); } },
			{ name: 'Geb.', field: 'data.birthdate', width: 75, cellFilter: 'date:"dd.MM.yyyy"', filterCellFiltered: true },
			{ name: 'Straße', field: 'data.street', width: 120 },
			{ name: 'Ort', field: 'data.city' }
		],
		data: DlrgTla.db[$scope.table]
	};

	$scope.gridOptions.onRegisterApi = function(gridApi)
	{
		DlrgTla.uiGrids[$scope.table] = gridApi;
		$scope.gridApi = gridApi;
		if (!$scope.cr) {
			$timeout(function() { $scope.gridApi.selection.selectRowByVisibleIndex(0); }, 0);
		} else {
			// only used if page/controller is included with ng-if instead of ng-show
			$timeout(function() {
				$scope.gridApi.selection.selectRow($scope.cr);
				var rowIndex = 0;
				gridApi.grid.rows.forEach(function(v, i) {
					if (v.entity == $scope.cr) {
						rowIndex = i;
					}
				});
				rowIndex = gridApi.grid.renderContainers.body.visibleRowCache.indexOf(gridApi.grid.rows[rowIndex]);
				gridApi.grid.element[0].getElementsByClassName("ui-grid-viewport")[0].scrollTop = rowIndex * gridApi.grid.options.rowHeight;
			}, 0);
		}

		$scope.gridApi.selection.on.rowSelectionChanged($scope, function(row) {
			var pos = DlrgTla.db[$scope.table].map(e => e.id).indexOf(row.entity.id);
			$scope.cr = DlrgTla.db[$scope.table][pos];
			DlrgTla.cr.p = $scope.cr;
		});
	}
}]); // ParticipantsCtrl


DlrgTlaApp.controller('DlgParticipantEditCtrl', function ($scope, $uibModalInstance, $http, $timeout, participant, copyFromParticipant)
{
	$scope.DlrgTla = DlrgTla;
	$scope.participant = participant;
	
	if (!$scope.participant) {
		$scope.participant = { data: {} };
		if (copyFromParticipant && copyFromParticipant.data) {
			angular.forEach(copyFromParticipant.data, 
				(v,k) => $scope.participant.data[k] = v);
		}
		DlrgTla.resetData($scope.participant, "participants");
	}
	
	if (participant) {
		$scope.modalTitle = "Teilnehmer bearbeiten";
	} else {
		$scope.modalTitle = "Neuen Teilnehmer hinzufügen";
	}

	$scope.ok = function () 
	{
		DlrgTla.thinking = "Teilnehmer wird gespeichert..."
		$scope.commitFailed = false;
		DlrgTla.setDataEnc($scope.participant);

		if ($scope.participant.id) {
			$http.put(apiBasePath + "api/db/participants/" + $scope.participant.id, { 
				data_enc: $scope.participant.data_enc
			}).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.changed) {
						$scope.participant.changedAt = response.data.changedAt;
						$scope.participant.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.participant, "participants", true);
					}
					$uibModalInstance.close('ok');
					console.log("put api/db/participants success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("put api/db/participants error", response);
				}
			);
		} else {
			//DlrgTla.db.participants.forEach
			var ident = ($scope.participant.data.lastName + $scope.participant.data.firstName + $scope.participant.data.birthdate).toLowerCase();
			for (p of DlrgTla.db.participants) {
				if (ident == (p.data.lastName + p.data.firstName + p.data.birthdate).toLowerCase())
				{
					if (!confirm("Teilnehmer mit gleichem Namen und Geburtsdatum existiert bereits. Trotzdem speichern?")) {
						DlrgTla.thinking = "";
						return;
					}
					break;
				}
			}

			$http.post(apiBasePath + "api/db/participants", { 
				data_enc: $scope.participant.data_enc 
			}).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.id) {
						$scope.participant.id = response.data.id;
						$scope.participant.changedAt = response.data.changedAt;
						$scope.participant.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.participant, "participants", true);
						DlrgTla.db.participants.push($scope.participant);
						$scope.cr = $scope.participant;
						$timeout(function() { 
							DlrgTla.uiGrids.participants.selection.selectRow($scope.cr);
							DlrgTla.uiGrids.participants.core.scrollTo($scope.cr);
						}, 0);
					}
					$uibModalInstance.close('ok');
					console.log("post api/db/participants success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("post api/db/participants error", response);
				}
			);
		}
	};

	$scope.delete = function () 
	{
		if (confirm("Teilnehmer wirklich löschen?")) {
			DlrgTla.thinking = "Teilnehmer wird gelöscht..."
			$scope.commitFailed = false;

			$http.delete(apiBasePath + "api/db/participants/" + $scope.participant.id).then(
				function(response) {
					DlrgTla.thinking = "";
					var pos = DlrgTla.db.participants.map(e => e.id).indexOf($scope.participant.id);
					DlrgTla.db.participants.splice(pos, 1);
					DlrgTla.uiGrids.participants.selection.selectRowByVisibleIndex(0);
					DlrgTla.uiGrids.participants.core.scrollTo(DlrgTla.uiGrids.participants.selection.getSelectedRows()[0]);
					$uibModalInstance.close('ok');
					console.log("delete api/db/participants success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("delete api/db/participants error", response);
				}
			);
		}
	};

	$scope.cancel = function () 
	{
		$uibModalInstance.dismiss('cancel');
	};
}) // DlgParticipantEditCtrl
