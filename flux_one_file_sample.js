// The View, Component #1 in Flux core components
// Will listen to any change in the store (check line number 9), if store fired an event that any change happened inside the store
// view will clear the old HTML elements, build new ones, append the new ones to the body 
function View(store, newsViewController){
	this.store = store;
	this.viewController = newsViewController;
	
	var self = this;
	this.store.addChangeListener(function(){
		self.render();
	});
}
View.prototype.render = function(){
	var self = this;
	var allNewsItems = this.store.getNewsItems();
	var btnAddItem = document.createElement('button');
	btnAddItem.innerText = 'Add Item';
	btnAddItem.onclick = function(){
	    var count = self.store.getNewsItemsCount();
	    var newsId = count + 1;
	    self.viewController.handleAddButtonClick(newsId);
	};
	
	var ul = document.createElement('ul');
	var onElementClick = function(){
			var element = this;
			self.viewController.handleItemClick(element);
		};
		
	for(var i=0; i < allNewsItems.length; i++){
		var newsItem = allNewsItems[i];
		var li = document.createElement('li');
		li.id = newsItem.id;
		li.style.backgroundColor = newsItem.color;
		li.innerText = newsItem.text;
		li.onclick = onElementClick;
		ul.appendChild(li);
	}
	var body = document.body
	body.innerHTML = '';
	body.appendChild(btnAddItem);
	body.appendChild(ul);
};



// The Store, Component #2 in Flux core components
// The most important component (in my opinion) in Flux 
// Will check every action coming from the dispatcher, then will decide if it (the store) need to update its internal data or not
// If internal data changed, it will fire an event that some change happened inside it
function Store(dispatcher){
	this.dispatcher = dispatcher;	
	var _allNewsItems = [
		{id:1, text:'News Item 1', color:''},
		{id:2, text:'News Item 2', color:''},
		{id:3, text:'News Item 3', color:''}
	];
	
	this.getNewsItemsCount = function(){
	  return  _allNewsItems.length;
	};
	
	this.getNewsItems = function(){
		// NOTE #0
		// remember store data should NOT give any external source the ability to modify its data, 
		// ONLY the store who should
		var _copyOfNewsItems = []; 
		
		for(var i = 0; i < _allNewsItems.length; ++i){
			var newsItem = _allNewsItems[i];
			// Check NOTE #0 again :)
			var copyOfNewsItem = {
				id: newsItem.id,
				text: newsItem.text,
				color: newsItem.color
			};
			_copyOfNewsItems.push(copyOfNewsItem);
		}
		return _copyOfNewsItems;
	};
	
	var self = this;
	function onActionDispatched(action){
		switch(action.type){
			case 'SELECT_NEWS':
				for (var i = 0; i <_allNewsItems.length; i++) {
					var newsItem = _allNewsItems[i];
					if (newsItem.id == action.newsId) {
						newsItem.color = action.activeColor;
						break;
					}
				}
				self.emitChange();
				break;
				
			case 'ADD_NEWS':
			    _allNewsItems.push({
			      id: action.newsId,
			      text: action.text,
			      color: ''
			    });
				self.emitChange();
			  break;
			  
			default:
				break;
		}
	}
	
	this.dispatcher.register(onActionDispatched);
	
	var _viewsCallbacks = [];
	
	this.addChangeListener = function(callback){
		_viewsCallbacks.push(callback);
	};
	this.emitChange = function(){
		for(var i=0; i < _viewsCallbacks.length; i++){
			var callbackToView = _viewsCallbacks[i];
			callbackToView();
		}
	};
}


// The Dispatcher, Component #3 in Flux core components
// Will pass any dispatched action to every store registered
function Dispatcher(){	
	var _storeCallbacks = [];
	this.register = function(callback){
		_storeCallbacks.push(callback);
	};
	this.dispatch = function(action){
		for(var i =0; i < _storeCallbacks.length; i++){
			var callbackToStore = _storeCallbacks[i];
			callbackToStore(action);
		}
	};
}


// The Action, Component #4 in Flux core components
// Holds all the needed data to complete an action in the app
function SelectNewsAction(newsId, activeColor){
	this.type = 'SELECT_NEWS';
	this.newsId = newsId;
	this.activeColor = activeColor;
}
function AddNewsAction(newsId, text){
  	this.type = 'ADD_NEWS';
  	this.newsId = newsId;
	  this.text = text;
}


function NewsViewController(newsActionCreators){
	this.newsActionCreators = newsActionCreators;
}
NewsViewController.prototype.handleItemClick = function(element){
	var newsId = element.id;
	this.newsActionCreators.selectNews(newsId);
};

NewsViewController.prototype.handleAddButtonClick = function(newsId){
	this.newsActionCreators.addNews(newsId);
};

function NewsActionCreators(dispatcher){
	this.dispatcher = dispatcher;
}
NewsActionCreators.prototype.selectNews = function(newsId){
	// doing anything before dispatching
	var action = new SelectNewsAction(newsId, 'red');
	this.dispatcher.dispatch(action);
	// doing anything after dispatching
};
NewsActionCreators.prototype.addNews = function(newsId){
	// doing anything before dispatching
	var text = 'News Item ' + newsId;
	var action = new AddNewsAction(newsId, text);
	this.dispatcher.dispatch(action);
	// doing anything after dispatching
};

var dispatcher = new Dispatcher();
var store = new Store(dispatcher);
var actionCreators = new NewsActionCreators(dispatcher);
var viewController = new NewsViewController(actionCreators);
var view = new View(store, viewController);
view.render();