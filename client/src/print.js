
var DlrgTla = null;
var DlrgTlaPrint = null;

var DlrgTlaPrintApp = angular.module('DlrgTlaPrintApp', [])

.controller('DlrgTlaPrintCtrl', function($scope, $filter) // root controller
{
	DlrgTlaPrint = this;
	$scope.DlrgTlaPrint = DlrgTlaPrint;
	$scope.secondHalf = false;
	$scope.presenceSheetsChecklist = true;
	$scope.passesOnlyPayed = true;
	$scope.passesOnlyNotSent = true;
	$scope.passesInstructors = false;
	$scope.passesCpId = 0;

	DlrgTlaPrint.print = function()
	{
		console.log("printing");
		window.print();
	}

	$scope.getParticipantName = function(obj)
	{
		var p = DlrgTla.getEntry("participants", obj.pId);
		if (p) {
			return p.data.lastName + ", " + p.data.firstName;
		} else {
			return null;
		}
	}

	$scope.getDates = function(begin, end)
	{
		var r = [];
		var b = new Date(begin);
		var e = new Date(end);
		while (b <= e) {
			var dom = b.getDate();
			var moy = b.getMonth()+1;
			r.push((dom < 10 ? "0"+dom : ""+dom) + "." + (moy < 10 ? "0"+moy : ""+moy));
			b.setDate(b.getDate() + 7);
		}
		return r;
	}

	$scope.hasChecklist = function(ctId)
	{
		if (!ctId) return false;
		var ctcl = DlrgTla.getEntriesFiltered("coursetypechecklists", { ctId: ctId });
		return ctcl ? (ctcl.length>0) : false;
	}

	$scope.pad = function (num, size)
	{
		if (!size) {
			size = 4;
		}
		return ('0000' + num).substr(-size);
	}

	if (window.parent.DlrgTla) {
		DlrgTla = window.parent.DlrgTla;
		$scope.DlrgTla = DlrgTla;
	} else {
		console.error("Cannot find DlrgTla");
	}
}) // DlrgTlaPrintCtrl

.filter('filterByCurrentSeason', function() 
{
	return function(courses) {
		var r = [];
		courses.forEach(c => { 
			if (c.sId == DlrgTla.sId) {
				r.push(c); 
			}
		});
		return r;
	}
})

.filter('filterCoursesByDates', function() 
{
	return function(courses, begin, end) {
		var r = [];
		courses.forEach(c => { 
			if (c.sId == DlrgTla.sId && (c.begin >= begin && c.begin < end || c.end > begin && c.end <= end)) {
				r.push(c); 
			}
		});
		return r;
	}
})

.filter('filterCourseParticipantsByDates', function($filter) 
{
	return function(courseparticipants, begin, end) {
		var r = [];
		var courses = $filter('filterCoursesByDates')(DlrgTla.db.courses, begin, end);
		var coursesMap = courses.map(e => e.id);
		courseparticipants.forEach(cp => { 
			if (cp.sId == DlrgTla.sId && coursesMap.indexOf(cp.cId) >= 0) {
				r.push(cp); 
			}
		});
		return r;
	}
})

.filter('filterCourseParticipants', function() 
{
	return function(courseparticipants, onlyPayed, onlyNotSent, instructors, cpId) {
		var r = [];
		courseparticipants.forEach(c => 
		{ 
			if (cpId && c.id==cpId || !cpId &&
				(c.sId == DlrgTla.sId && 
				 (!onlyPayed || (c.charge === 0 || c.data.chargePayedAt)) &&
				 (!onlyNotSent || c.passSent === 0) &&
				 (instructors ? c.instructor === 1 : c.instructor === 0)))
			{
				r.push(c);
			}
		});
		return r;
	}
})

.filter('pagingPages', function() 
{
	return function(items, itemsPerPage) {
		var numberOfpages = Math.ceil(items.length / itemsPerPage);
		return _.range(1, numberOfpages+1);
	}
})

.filter('pagingItems', function() 
{
	return function(items, itemsPerPage, pageNr) {
		var numberOfpages = Math.ceil(items.length / itemsPerPage);
		var r = items.slice((pageNr-1)*itemsPerPage, pageNr*itemsPerPage);
		console.log((pageNr-1)*itemsPerPage, pageNr*itemsPerPage, r);
		return items.slice((pageNr-1)*itemsPerPage, pageNr*itemsPerPage);
	}
})

.filter('shorten', function() 
{
	return function(value, count) {
		if (!count) count = 14;
		if (typeof value != "string") return value;
		if (value.length > count) {
			return value.substr(0, count-2) + "...";
		} else {
			return value;
		}
	}
})

.filter('dbfield', function() 
{
	var dbfieldCache = {};
	return function(value, table, field) {
		if (!dbfieldCache[table]) dbfieldCache[table] = {};
		var p = dbfieldCache[table][value];
		if (!p) {
			var len = DlrgTla.db[table].length;
			for (var i = 0; i < len; i++) {
				if (DlrgTla.db[table][i].id == value) {
					p = DlrgTla.db[table][i];
					dbfieldCache[table][value] = p;
					break;
				}
			}
			if (!p) {
				return value;
			}
		}

		if (field) {
			var fields = field.split('.');
			var val = p;
			fields.forEach(f => val = val[f]);
			if (typeof val == "function" && fields.length == 1) {
				return val.call(p);
			} else {
				return val;
			}

		} else {
			return p;

		}
	}
})

;
