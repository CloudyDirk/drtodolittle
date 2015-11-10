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

	// Logging

	var log = [];
	
	function _log(logtxt){
		log.push(logtxt);
		if(log.length>32){
			log.shift();
		}
	}

	function _getLog(){
		return log;
	}
	
	for(i=0;i<32;i++){
		_log("");
	}
	
	// Todos
	
	var todos = [];

	function _getTodos(){
		return todos;
	}
	
	function _setTodos(todolist){
		todos=todolist;
	}
	
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
	}

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

	_addTodo("Immer schön speichern!");
	todos[0].done = 1;

	// Returns
	
	return{
		log : _log,
		getLog : _getLog,
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

	// init

	$scope.todos = Fact.getTodos();
	$scope.log = Fact.getLog();

	$scope.s_login = 1;
	$scope.s_list = 0;
	$scope.s_add = 0;

	// keyboard functions
	
	$scope.mainKeydown=function(e){
		if($scope.s_login==0){
			var k = e.keyCode;
			if(k==107){//+ on numpad
				e.preventDefault();
				$scope.s_add = 1;
				$timeout(function(){
					document.getElementById("todotxta").focus();
				},128);
				Fact.log("NewTodo-Dialog.");				
			}	
		}
	}	

	$scope.newtodoKeydown=function(e,newtodotxt){
		var k = e.keyCode;
		if(k==13){//ret
			e.preventDefault();
			Fact.addTodo(newtodotxt);
			$scope.newtodotxt = "";
			$scope.s_add = 0;
			$scope.s_list = 1;
			window.scrollTo(0,0);
			Fact.log("Todo added.");
		} else 
		if(k==27){//esc
			e.preventDefault();			
			$scope.newtodotxt = "";
			$scope.s_add = 0;
			$scope.s_list = 1;
			Fact.log("Todo not added.");
		} else
		if(k==9){//tab
			e.preventDefault();
		}
	}

	$scope.todolineKeydown=function(e,id){
		var k=e.keyCode;
		if(k==13 || k==27 || k==107){//ret,esc,+
			e.preventDefault();
			document.getElementById("todoid"+id).blur();
			Fact.log("Todo unfocused.");
		}
	}

	// todo functions
	
	$scope.seltodoline=function(id){
		document.getElementById("todoid"+id).focus();
		Fact.log("Todo focused.");
	}	
	
	$scope.deltodo=function(item){
		Fact.delTodo(item);
		Fact.log("ToDo deleted.");
		if(Fact.getTodos().length==0){
			Fact.log("Todo-List is empty.");			
		}
	}

	$scope.togDone=function(item){
		Fact.togDoneTodo(item);
		Fact.log("Todo-Flag changed.");
	}

	$scope.newtodo=function(){
		$scope.s_add = 1;
		$timeout(function(){
			var ta=document.getElementById("todotxta");
			ta.focus();
		},128);
		Fact.log("New Todo-Dialog.");
	}
	
	$scope.gettodos=function(){
		Fact.log("Getting data from server...");
		$http({
			method:"get",
			url: "http://www.drtodolittle.de:8181/rest-api/tasks"
		}).then(
			function successCallback(response) {
				Fact.log("Done.");
				Fact.log("Updateing Todo-List.");
				response.data.forEach(function(o){
					var nobj = {
						ts:0,
						tshr:o.id,
						txt:o.subject,
						done:o.completed					
					}
					Fact.addTodoObj(nobj);
				});
				Fact.log("Done.");
			}
			,
			function errorCallback(response) {
				Fact.log("Error!");
				Fact.log("Check browser console for details.");				
				console.log(JSON.stringify(response));
			}
		);
	}
		
	// login functions
		
	$scope.dologin=function(){
		$scope.s_login=0;
		$scope.s_list=1;
		Fact.log("Logged in.");
	}
	
	$scope.dologout=function(){
		$scope.s_login=1;
		$scope.s_list=0;
		$scope.s_add=0;
		Fact.log("Logged out.");
	}

	Fact.log("Client Log-System ready.");
	
});
