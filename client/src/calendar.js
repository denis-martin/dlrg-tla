
Number.prototype.pad = function(size) {
	var s = String(this);
	while (s.length < (size || 2)) {s = "0" + s;}
	return s;
}

DlrgTlaApp.controller('CalendarCtrl', ['$scope', '$http', '$timeout', 'uiCalendarConfig', function ($scope, $http, $timeout, uiCalendarConfig)
{
	$scope.DlrgTla = DlrgTla;

	DlrgTla.uiCalendarConfig = uiCalendarConfig;
	DlrgTla.calendar = {};

	$scope.show = {
		birthdates: true,
		ferienbw: true,
		feiertage: true,
		dlrgettlingen: true,
	}
	$scope.events = {
		birthdates: [],
	};
	$scope.eventSources = [
		//[ {title: 'All Day Event', start: new Date(), allDay: true} ]
	];
	
	$scope.calendarConfig = {
		height: 470,
		lang: 'de',
		eventRender: function(event, element) {
			element.attr('title', event.title);
		}
	}

	$scope.setVisibility = function(name)
	{
		if ($scope.show[name]) {
			uiCalendarConfig.calendars.calendar.fullCalendar('addEventSource', $scope.events[name]);
		} else {
			uiCalendarConfig.calendars.calendar.fullCalendar('removeEventSource', $scope.events[name]);
		}
	}

	$scope.compareDateToNow = function(d)
	{
		var date = new Date(d);
		var now = new Date;
		return date < now ? -1 : (date > now ? 1 : 0);
	}

	DlrgTla.calendar.load = function(name)
	{
		$http.get("/api/calendars/" + name).then(
			function(res) { // success
				uiCalendarConfig.calendars.calendar.fullCalendar('removeEventSource', $scope.events[name]);
				$scope.events[name] = fc_events(res.data, { className: "cal" + name });
				$scope.events[name].forEach(e => {
					if (!e.allDay && e.start.getHours() == 0 && e.start.getMinutes() == 0 && e.end.getHours() == 0 && e.end.getMinutes() == 0) {
						e.allDay = true;
					}
				});
				if ($scope.show[name]) {
					uiCalendarConfig.calendars.calendar.fullCalendar('addEventSource', $scope.events[name]);
				}
			},
			function(res) { // error
				console.error("Error fetching calendar " + name, res);
			}
		);
	}

	DlrgTla.calendar.setBirthdates = function(participants)
	{
		uiCalendarConfig.calendars.calendar.fullCalendar('removeEventSource', $scope.events.birthdates);
		$scope.events.birthdates.length = 0;
		var d = new Date();
		var y = d.getFullYear();
		angular.forEach(participants, (v,k) => {
			var b = v.getSetBirthdate()
			if (b) {
				$scope.events.birthdates.push({ title: v.data.lastName + ", " + v.data.firstName + " (" + (y-b.getFullYear()) + ")", 
					start: new Date(y, b.getMonth(), b.getDate()), allDay: true });
				$scope.events.birthdates.push({ title: v.data.lastName + ", " + v.data.firstName + " (" + (y+1-b.getFullYear()) + ")", 
					start: new Date(y+1, b.getMonth(), b.getDate()), allDay: true });
			}
		});
		if ($scope.show.birthdates) {
			uiCalendarConfig.calendars.calendar.fullCalendar('addEventSource', $scope.events.birthdates);
		}
	}
}]);
