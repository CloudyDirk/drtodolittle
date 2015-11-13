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
		todos = todolist;
	}

	function _clearTodos(){
		while(todos.length>0){
			todos.pop();
		}
	}
	
	function _getTodoById(id){
		var ret = undefined;
		todos.forEach(function(obj){
			if(obj.id==id){
				ret=obj;
			}
		});
		return ret;
	}
	
	function _addTodoObj(obj){
		todos.unshift(obj);
	}
	
	function _delTodo(item){
		var idx = todos.indexOf(item)
		todos.splice(idx,1);		
	}

	function _togCompleted(item){
		var idx = todos.indexOf(item);
		var todo = todos[idx];
		if(todo.completed){
			todo.completed = false;
		} else {
			todo.completed = true;
		}
	}

	// Returns
	
	return{
		log : _log,
		getLog : _getLog,
		getTodos : _getTodos,
		setTodos : _setTodos,
		clearTodos : _clearTodos,
		getTodoById : _getTodoById,
		addTodoObj : _addTodoObj,
		delTodo : _delTodo,
		togCompleted : _togCompleted,
	};
		
});

/*
  Main controller ----------------------------------------
*/
tdapp.controller("MainCtrl",function($scope,$timeout,$interval,$http,Fact){

	// init

	$scope.todos = Fact.getTodos();
	$scope.log = Fact.getLog();

	$scope.s_login = 1;
	$scope.s_working = 0;
	$scope.s_list = 0;
	$scope.s_add = 0;

	// communication with server
	
	var server = "http://localhost:3000/tasks";

	function errorCallback(response) {
		Fact.log("Error!");
		Fact.log("Check browser console for details.");				
		console.log(JSON.stringify(response));
	}

	function gettodos(){
		Fact.log("Sending request (get) to server...");
		$scope.s_working=1;
		$scope.s_list=0;
		$http({
			method:"get",
			url: server
		}).then(
			function successCallback(response) {
				Fact.log("Done.");
				Fact.log("Updating local Todo-List.");
				response.data.forEach(function(o){
					Fact.addTodoObj({
						"id":o.id,
						"subject":o.subject,
						"completed":o.completed
					});
				});
				Fact.log("Done.");
				$timeout(function(){
					$scope.s_list=1;
					$scope.s_working=0;
				},1000);
				$timeout(function(){
					document.getElementById("searchf").focus();
				},1128);
			}
			,
			function(response) {
				Fact.log("Error!");
				Fact.log("Check browser console for details.");				
				console.log(JSON.stringify(response));
				$scope.errormsg="Server not available!";
				$scope.dologout();
			}
		);
	}
	$scope.gettodos=gettodos;

	function posttodo(obj){
		Fact.log("Sending request (post) to server...");
		$http({
			method:"post",
			url: server,
			header: "application/json",
			data: obj
		}).then(
			function successCallback(response) {
				Fact.log("Done.");
				obj.id=response.data.id;
			}
			,
			errorCallback
		);
	}	

	function puttodo(obj){
		Fact.log("Sending request (put) to server...");
		$http({
			method:"put",
			url: server+"/"+obj.id,
			header: "application/json",
			data: obj
		}).then(
			function successCallback(response) {
				Fact.log("Done.");
			}
			,
			errorCallback
		);
	}	

	function deletetodo(obj){
		Fact.log("Sending request (delete) to server...");
		$http({
			method:"delete",
			url: server+"/"+obj.id,
			header: "application/json",
			data: obj
		}).then(
			function successCallback(response) {
				Fact.log("Done.");
			}
			,
			errorCallback
		);
	}	
		
	// Keyboard functions

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

	$scope.newtodoKeydown=function(e){
		var k = e.keyCode;
		if(k==13){//ret
			e.preventDefault();
			var newtodo = {
				"subject":$scope.newtodotxt,
				"completed":false
			};
			$scope.newtodotxt = "";
			$scope.s_add = 0;
			$scope.s_list = 1;
			posttodo(newtodo);
			Fact.addTodoObj(newtodo);
			window.scrollTo(0,0);
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
			Fact.log("Change Todo (id:"+id+").");
			var currentTodo = document.getElementById("todoid"+id); 
			currentTodo.blur();
			Fact.log("Todo unfocused.");
			
			var obj = Fact.getTodoById(id);
			if(obj!=undefined){
				Fact.log("Done.");
				Fact.log("Updating data on server.");
				obj.subject=currentTodo.innerHTML;
				puttodo(obj);
				Fact.log("Todo (id:"+id+") updated.");			
			} else {
				Fact.log("Error.");
			}
		}
	}

	$scope.loginKeydown=function(e){
		var k=e.keyCode;
		if(k==13){//ret
			e.preventDefault();
			$scope.dologin();
		}
	}
	
	// Todo-Functions
	
	$scope.seltodoline=function(id){
		document.getElementById("todoid"+id).focus();
		Fact.log("Todo focused.");
	}	
	
	$scope.deltodo=function(obj){
		obj.opac=1;
		obj.del=false;
		$interval(function(){
			var x = document.getElementById("todox"+obj.id);
			obj.opac = obj.opac - 0.05;
			x.style.opacity = obj.opac;
			if(obj.opac<=0 && !obj.deleted){
				obj.deleted=true;
				deletetodo(obj);
				//Fact.delTodo(obj);
				Fact.log("ToDo deleted.");			
			}
		},32,32);
		if(Fact.getTodos().length==0){
			Fact.log("Todo-List is empty.");			
		}
	}

	$scope.togCompleted=function(obj){
		Fact.togCompleted(obj);
		puttodo(obj);
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
	
	// Login functions
			
	function logout(){
		$scope.s_login=0;
		$scope.s_list=0;
		$scope.s_add=0;
		$scope.s_working=1;
		Fact.clearTodos();
		$timeout(function(){
			$scope.s_working=0;
			$scope.s_login=1;
		},1000);
		Fact.log("Logged out.");
	}
	$scope.dologout=logout;

	function login(){
		if($scope.liusername=="gast" && md5($scope.lipass)=="d4061b1486fe2da19dd578e8d970f7eb"){
			Fact.log("Logged in.");		
			$scope.errormsg="";
			$scope.s_login=0;
			$scope.gettodos();
		} else {
			$scope.errormsg="Username/Password-Error!";
			$scope.dologout();
		}
	}
	$scope.dologin=login;
	
	// Init
	
	Fact.log("Client Log-System ready.");
	
	document.getElementById("liusername").focus();
	
	if($scope.s_list==1){
		$scope.gettodos();
	}
	
});
