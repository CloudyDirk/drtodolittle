/*

	tdapp.js

*/
var tdapp=angular.module("tdapp",[]);

/*

  Help functions ----------------------------------------

*/
function fkts_tsHr(x){
	var ts = new Date(x);
	var dd = ts.getDate();if(dd<10) dd="0"+dd;
	var mm = ts.getMonth()+1;if(mm<10) mm="0"+mm; //+1 because jan is 0
	var yyyy = ts.getFullYear();
	var h = ts.getHours();if(h<10) h="0"+h;
	var m = ts.getMinutes();if(m<10) m="0"+m;
	var s = ts.getSeconds();if(s<10) s="0"+s;
	return dd+"."+mm+"."+yyyy+" / "+h+":"+m+":"+s;
}

/*

  Factory ----------------------------------------

*/
tdapp.factory("Fact",function(){		
		
	var todos = [];
	
	function _addTodoObj(obj){
		todos.unshift(obj);
	}
	
	function _addTodo(todotxt){
		var tmp_ts = Date.now();
		var tmp_tshr = fkts_tsHr(tmp_ts); 
		var obj = {
			ts:tmp_ts,
			tshr:tmp_tshr,
			txt:todotxt,
			done:0
		};
		todos.unshift(obj);
		//todos.push(obj);
	}

	_addTodo("Immer schön speichern!");
	todos[0].done = 1;
	
	function _delTodo(item){
		var idx = todos.indexOf(item)
		todos.splice(idx,1);		
	}

	function _togDoneTodo(item){
		var idx = todos.indexOf(item);
		var todo = todos[idx];
		if(todo.done==0){
			todo.done = 1;
		} else {
			todo.done = 0;
		}
	}

	function _getTodos(){
		return todos;
	}
	
	function _setTodos(todolist){
		todos=todolist;
	}
					
	return{
		addTodo : _addTodo,
		addTodoObj : _addTodoObj,
		getTodos : _getTodos,
		delTodo : _delTodo,
		togDoneTodo : _togDoneTodo,
		setTodos : _setTodos,
	};
		
});

/*

  Main controller ----------------------------------------

*/
tdapp.controller("MainCtrl",function($scope,$timeout,$http,Fact){

	$scope.todos = Fact.getTodos();
	$scope.s_login = 0;
	$scope.s_list = 1;
	$scope.s_add = 0;
  
	$scope.mainKeydown=function(e){
		if($scope.s_login==0){
			var k = e.keyCode;
			if(k==107){//+ on numpad
				e.preventDefault();
				$scope.s_add = 1;
				//set focus to textarea
				$timeout(function(){
					document.getElementById("txta").focus();
				},128);			
			}	
		}
	}	

	$scope.taKeydown=function(e,newtodotxt){
		var k = e.keyCode;
		if(k==13){//ret
			e.preventDefault();
			Fact.addTodo(newtodotxt);
			$scope.newtodotxt = "";
			$scope.s_add = 0;
			$scope.s_list = 1;
			window.scrollTo(0,0);
		} else 
		if(k==27){//esc
			e.preventDefault();			
			$scope.newtodotxt = "";
			$scope.s_add = 0;
			$scope.s_list = 1;			
		}
	}

	$scope.tdKeydown=function(e,id){
		var k=e.keyCode;
		if(k==13 || k==27 || k==107){//ret,esc,+
			e.preventDefault();
			document.getElementById("todotxt"+id).blur();
		}
	}

	$scope.sel=function(id){
		document.getElementById("todotxt"+id).focus();
	}	
	
	$scope.del=function(item){
		Fact.delTodo(item);
		if(Fact.getTodos().length==0){
			$scope.s_list = 0;			
		}
	}

	$scope.togDone=function(item){
		Fact.togDoneTodo(item);
		if(Fact.getTodos().length==0){
			$scope.s_list = 0;			
		}
	}
	
	$scope.newtodo=function(){
		$scope.s_add = 1;
		$timeout(function(){
			var ta=document.getElementById("txta");
			ta.focus();
		},128);
	}

	//get todos from server
	$scope.gettodosfromserver=function(){
		$http({
		  url: "http://www.drtodolittle.de:8181/rest-api/tasks/"
		}).then(
			function successCallback(response) {
				response.data.forEach(function(o){
					var nobj = {
						ts:0,
						tshr:o.id,
						txt:o.subject,
						done:o.completed					
					}
					Fact.addTodoObj(nobj);
				});
			}
			,
			function errorCallback(response) {
				var e = JSON.stringify(response);
				alert("error:"+e);
			}
		);
	}
});
