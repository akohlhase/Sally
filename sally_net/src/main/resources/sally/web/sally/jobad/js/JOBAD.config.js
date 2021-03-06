/*
	JOBAD Configuration
	JOBAD.config.js
	
	Copyright (C) 2013 KWARC Group <kwarc.info>
	
	This file is part of JOBAD.
	
	JOBAD is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	
	JOBAD is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.
	
	You should have received a copy of the GNU General Public License
	along with JOBAD.  If not, see <http://www.gnu.org/licenses/>.
*/


//StorageBackend

JOBAD.storageBackend = {
	"getKey": function(key, def){
		var res = JOBAD.storageBackend.engines[JOBAD.config.storageBackend][0](key);
		if(typeof res == "string"){
			return JSON.parse(res);
		} else {
			return def;
		}
	}, 
	"setKey": function(key, value){return JOBAD.storageBackend.engines[JOBAD.config.storageBackend][1](key, JSON.stringify(value));}
}

JOBAD.storageBackend.engines = {
	"none": [function(key){}, function(key, value){}],
	"cookie": [function(key){
		var cookies = document.cookie;
		
		var startIndex = cookies.indexOf(" "+key+"=");
		startIndex = (startIndex == -1)?cookies.indexOf(key+"="):startIndex;

		if(startIndex == -1){
			//we can't find it
			return false;
		}

		//we sart after start Index
		startIndex = cookies.indexOf("=", startIndex)+1; 

		var endIndex = cookies.indexOf(";", startIndex);
		endIndex = (endIndex == -1)?cookies.length:endIndex; //till the end

		return unescape(cookies.substring(startIndex, endIndex));
	}, function(key, value){
		//sets a cookie
		var expires=new Date();
		expires.setDate(expires.getDate()+7); //store settings for 7 days
		document.cookie = escape(key) + "=" + escape(value) + "; expires="+expires.toUTCString()+"";
	}]
};

JOBAD.config.storageBackend = "cookie";



//Config Settings - module based
/*
	Validates if specefied object of a configuration object can be set. 
	@param	obj Configuration Object
	@param	key	Key to validate. 
	@param	val	Value to validate. 
	@returns boolean
*/
JOBAD.modules.validateConfigSetting = function(obj, key, val){
	if(!obj.hasOwnProperty(key)){
		JOBAD.console.warn("Undefined user setting: "+key);
		return false;
	}
	var type = obj[key][0];
	var validator = obj[key][1];
	switch(type){
		case "string":
			return (validator(val) && typeof val == "string");
			break;
		case "bool":
			return (typeof val == "boolean");
			break;
		case "integer":
			return (typeof val == "number" && val % 1 == 0 && validator(val));
			break;
		case "number":
			return (typeof val == "number" && validator(val));
			break;
		case "list":
			return validator(val);
			break;
		case "none":
			return true;
			break;
	}
};

/*
	Creates a proper User Settings Object
	@param	obj Configuration Object
	@param modName	Name of the module
	@returns object
*/
JOBAD.modules.createProperUserSettingsObject = function(obj, modName){

	var newObj = {};
	for(var key in obj){
		
		var WRONG_FORMAT_MSG = "Ignoring UserConfig '"+key+"' in module '"+modName+"': Wrong description format";
		
		if(obj.hasOwnProperty(key)){
			(function(){
			var spec = obj[key];
			var newSpec = [];
			
			if(!JOBAD.util.isArray(spec)){
				JOBAD.console.warn(WRONG_FORMAT_MSG+" (Array required). ");
				return;
			}
			
			if(spec.length == 0){
				JOBAD.console.warn(WRONG_FORMAT_MSG+" (Array may not have length zero). ");
				return;
			}
			
			if(typeof spec[0] == 'string'){
				var type = spec[0];
			} else {
				JOBAD.console.warn(WRONG_FORMAT_MSG+" (type must be a string). ");
				return; 
			}
			if(type == "none"){
				if(spec.length == 2){
					var def = spec[1];
				} else {
					JOBAD.console.warn(WRONG_FORMAT_MSG+" (Array length 2 required for 'none'. ");
					return;
				}
			} else if(spec.length == 4){
				var validator = spec[1];
				var def = spec[2];
				var meta = spec[3];
			} else if(spec.length == 3) {
				var validator = function(){return true;};
				var def = spec[1];
				var meta = spec[2];
			} else {
				JOBAD.console.warn(WRONG_FORMAT_MSG+" (Array length 3 or 4 required). ");
				return; 
			}
			
			switch(type){
				case "string":
					newSpec.push("string");
					
					//validator
					if(JOBAD.util.isRegExp(validator)){
						newSpec.push(function(val){return validator.test(val)});
					} else if(typeof validator == 'function') {
						newSpec.push(validator);
					} else {
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Unknown restriction type for 'string'. ). ");
						return;
					}
					
					//default
					try{
						if(newSpec[newSpec.length-1](def) && typeof def == 'string'){
							newSpec.push(def);
						} else {
							JOBAD.console.warn(WRONG_FORMAT_MSG+" (Validation function failed for default value. ). ");
							return;
						}
					} catch(e){
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Validation function caused exception for default value. ). ");
						return;
					}
					
					//meta
					if(typeof meta == 'string'){
						newSpec.push([meta, ""]);
					} else if(JOBAD.util.isArray(meta)) {
						if(meta.length == 1){
							meta.push("");
						}
						if(meta.length == 2){
							newSpec.push(meta);
						} else {
							JOBAD.console.warn(WRONG_FORMAT_MSG+" (Meta data not allowed for length > 2). ");
							return;
						}
					} else {
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Meta data needs to be a string or an array). ");
						return;
					}
					
					break;
				case "bool":
					newSpec.push("bool");
					
					//Validator
					if(spec.length == 4){
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Type 'boolean' may not have restrictions. )");
						return;
					}					
					newSpec.push(validator);
					
					//default
					try{
						if(newSpec[newSpec.length-1](def) && typeof def == 'boolean'){
							newSpec.push(def);
						} else {
							JOBAD.console.warn(WRONG_FORMAT_MSG+" (Validation function failed for default value. ). ");
							return;
						}
					} catch(e){
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Validation function caused exception for default value. ). ");
						return;
					}
					
					//meta
					if(typeof meta == 'string'){
						newSpec.push([meta, ""]);
					} else if(JOBAD.util.isArray(meta)) {
						if(meta.length == 1){
							meta.push("");
						}
						if(meta.length == 2){
							newSpec.push(meta);
						} else {
							JOBAD.console.warn(WRONG_FORMAT_MSG+" (Meta data not allowed for length > 2). ");
							return;
						}
					} else {
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Meta data needs to be a string or an array). ");
						return;
					}
					
					break;
				case "integer":
					newSpec.push("integer");
					
					//validator
					if(JOBAD.util.isArray(validator)){
						if(validator.length == 2){
							newSpec.push(function(val){return (val >= validator[0])&&(val <= validator[1]);});
						} else {
							JOBAD.console.warn(WRONG_FORMAT_MSG+" (Restriction Array must be of length 2). ");
						}
					} else if(typeof validator == 'function') {
						newSpec.push(validator);
					} else {
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Unknown restriction type for 'integer'. ). ");
						return;
					}
					
					//default
					try{
						if(newSpec[newSpec.length-1](def) && (def % 1 == 0)){
							newSpec.push(def);
						} else {
							JOBAD.console.warn(WRONG_FORMAT_MSG+" (Validation function failed for default value. ). ");
							return;
						}
					} catch(e){
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Validation function caused exception for default value. ). ");
						return;
					}
					
					//meta
					if(typeof meta == 'string'){
						newSpec.push([meta, ""]);
					} else if(JOBAD.util.isArray(meta)) {
						if(meta.length == 1){
							meta.push("");
						}
						if(meta.length == 2){
							newSpec.push(meta);
						} else {
							JOBAD.console.warn(WRONG_FORMAT_MSG+" (Meta data not allowed for length > 2). ");
							return;
						}
					} else {
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Meta data needs to be a string or an array). ");
						return;
					}
					
					break;
				case "number":
					newSpec.push("number");
					
					//validator
					if(JOBAD.util.isArray(validator)){
						if(validator.length == 2){
							newSpec.push(function(val){return (val >= validator[0])&&(val <= validator[1]);});
						} else {
							JOBAD.console.warn(WRONG_FORMAT_MSG+" (Restriction Array must be of length 2). ");
						}
					} else if(typeof validator == 'function') {
						newSpec.push(validator);
					} else {
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Unknown restriction type for 'number'. ). ");
						return; 
					}
					
					//default
					try{
						if(newSpec[newSpec.length-1](def) && typeof def == 'number'){
							newSpec.push(def);
						} else {
							JOBAD.console.warn(WRONG_FORMAT_MSG+" (Validation function failed for default value. ). ");
							return;
						}
					} catch(e){
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Validation function caused exception for default value. ). ");
						return;
					}
					
					//meta
					if(typeof meta == 'string'){
						newSpec.push([meta, ""]);
					} else if(JOBAD.util.isArray(meta)) {
						if(meta.length == 1){
							meta.push("");
						}
						if(meta.length == 2){
							newSpec.push(meta);
						} else {
							JOBAD.console.warn(WRONG_FORMAT_MSG+" (Meta data not allowed for length > 2). ");
							return;
						}
					} else {
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Meta data needs to be a string or an array). ");
						return;
					}
					
					break;
				case "list":
					newSpec.push("list");
					
					
					//validator
					if(JOBAD.util.isArray(validator) && spec.length == 4){
							if(validator.length == 0){
								JOBAD.console.warn(WRONG_FORMAT_MSG+" (Array restriction must be non-empty). ");
								return;
							}
							newSpec.push(function(val){return (JOBAD.util.indexOf(validator, val) != -1);});
					} else {
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Type 'list' needs array restriction. ). ");
						return;
					}
					
					//default
					try{
						if(newSpec[newSpec.length-1](def)){
							newSpec.push(def);
						} else {
							JOBAD.console.warn(WRONG_FORMAT_MSG+" (Validation function failed for default value. ). ");
							return;
						}
					} catch(e){
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Validation function caused exception for default value. ). ");
						return;
					}
					
					//meta
					if(JOBAD.util.isArray(meta)) {
						if(meta.length == validator.length+1){
							newSpec.push(meta);
						} else {
							JOBAD.console.warn(WRONG_FORMAT_MSG+" (Meta data has wrong length). ");
							return;
						}
					} else {
						JOBAD.console.warn(WRONG_FORMAT_MSG+" (Meta data for type 'list' an array). ");
						return;
					}
					
					//construction-data
					newSpec.push(validator); 
					
					break;
				case "none": 
					newSpec.push("none");
					newSpec.push(def);
					break;
				default:
					JOBAD.console.warn(WRONG_FORMAT_MSG+" (Unknown type '"+type+"'. ). ");
					return;
					break;
			}
			newObj[key] = newSpec;
			})();
		}
	}
	return newObj;
};

/*
	Gets the default of a configuration object
	@param	obj Configuration Object
	@param	key	Key to get. 
	@returns object
*/
JOBAD.modules.getDefaultConfigSetting = function(obj, key){
	if(!obj.hasOwnProperty(key)){
		JOBAD.console.warn("Undefined user setting: "+key);
		return;
	}
	return obj[key][2];
};

//Config Settings - module
var configCache = {}; //cache of set values
var configSpec = {};

var userConfigMessages = {}; //messages for userconfig


JOBAD.UserConfig = {};

/*
	Sets a user configuration. 
	@param id   Id of module to use UserConfig from. 
	@param prop	Property to set
	@param val	Value to set. 
*/
JOBAD.UserConfig.set = function(id, prop, val){
	var value = JOBAD.UserConfig.getTypes(id);

	if(JOBAD.util.isObject(prop)){
		var keys = JOBAD.util.keys(prop);
		return JOBAD.util.map(keys, function(key){
			return JOBAD.UserConfig.set(id, key, prop[key]);
		});
	}

	if(JOBAD.UserConfig.canSet(id, prop, val)){
		if(JOBAD.util.objectEquals(val, JOBAD.UserConfig.get(id, prop))){
			return; //we have it already; no change neccessary. 
		}
		configCache[id][prop] = val;
		
	} else {
		JOBAD.console.warn("Can not set user config '"+prop+"' of module '"+id+"': Validation failure. ");
		return; 
	}
	JOBAD.storageBackend.setKey(id, configCache[id]);
	JOBAD.refs.$("body").trigger("JOBAD.ConfigUpdateEvent", [prop, id]);

	return prop;
};

/*
	Checks if a user configuration can be set. 
	@param id   Id of module to use UserConfig from. 
	@param prop	Property to set
	@param val	Value to set. 
*/
JOBAD.UserConfig.canSet = function(id, prop, val){
	var value = JOBAD.UserConfig.getTypes(id);
	if(JOBAD.util.isObject(prop)){
		var keys = JOBAD.util.keys(prop);
		return JOBAD.util.lAnd(JOBAD.util.map(keys, function(key){
			return JOBAD.modules.validateConfigSetting(value, key, prop[key]);
		}));
	} else {
		return JOBAD.modules.validateConfigSetting(value, prop, val);
	}
};

/*
	Retrieves a user configuration setting. 
	@param id   Id of module to use UserConfig from. 
	@param prop	Property to get
	@param val	Value to get. 
*/
JOBAD.UserConfig.get = function(id, prop){
	var value = JOBAD.UserConfig.getTypes(id);

	if(JOBAD.util.isObject(prop) && !JOBAD.util.isArray(prop)){
		var prop = JOBAD.util.keys(prop);
	}
	if(JOBAD.util.isArray(prop)){
		var res = {};

		JOBAD.util.map(prop, function(key){
			res[key] = JOBAD.UserConfig.get(id, key);
		});

		return res;
	}

	var res = configCache[id][prop];
	if(JOBAD.modules.validateConfigSetting(value, prop, res)){
		return res;
	} else {
		JOBAD.console.log("Failed to access user setting '"+prop+"'");
		return;
	}
};

/*
	Gets the user configuration types. 
	@param id   Id of module to use UserConfig from. 
*/
JOBAD.UserConfig.getTypes = function(id){
	if(!configSpec.hasOwnProperty(id)){
		JOBAD.error("Can't access UserConfig for module '"+id+"': Module not found (is it registered yet? )");
		return; 
	}
	return configSpec[id];
}

/*
	Resets the user configuration. 
	@param id   Id of module to use UserConfig from. 
	@param prop Optional. Property to reset. 
*/
JOBAD.UserConfig.reset = function(id, prop){
	var value = JOBAD.UserConfig.getTypes(id);
	configCache[id] = JOBAD.storageBackend.getKey(id);
	if(typeof configCache[id] == "undefined"){
		configCache[id] = {};
		for(var key in value){
			configCache[id][key] = JOBAD.modules.getDefaultConfigSetting(value, key);
			JOBAD.refs.$("body").trigger("JOBAD.ConfigUpdateEvent", [key, id]);
		}
	}
};


/*
	Gets the current message set by the module. 
	@param	id	Id of module to use. 
*/
JOBAD.UserConfig.getMessage = function(id){
	if(!configSpec.hasOwnProperty(id)){
		JOBAD.error("Can't access UserConfig for module '"+id+"': Module not found (is it registered yet? )");
		return; 
	}

	var msg = userConfigMessages[id];

	return (typeof msg == "undefined"?"":msg); 
}

/*
	Sets the current message set by the module. 
	@param	id	Id of module to use. 
	@param	msg	New message
*/
JOBAD.UserConfig.setMessage = function(id, msg){
	if(!configSpec.hasOwnProperty(id)){
		JOBAD.error("Can't access UserConfig for module '"+id+"': Module not found (is it registered yet? )");
		return; 
	}
	userConfigMessages[id] = msg;
	return msg;
}

/*
	Gets a UserConfig Object for the sepecefied module id. 
	@param id	Identifier of module to get UserConfig for. 
*/
JOBAD.UserConfig.getFor = function(id){
	if(!configSpec.hasOwnProperty(id)){
		JOBAD.error("Can't access UserConfig for module '"+id+"': Module not found (is it registered yet? )");
		return; 
	}

	return {
		"set": function(prop, val){
			return JOBAD.UserConfig.set(id, prop, val);
		},
		"setMessage": function(msg){
			return JOBAD.UserConfig.setMessage(id, msg);
		},
		"get": function(prop){
			return JOBAD.UserConfig.get(id, prop);
		},
		"getMessage": function(){
			return JOBAD.UserConfig.getMessage(id);
		},
		"canSet": function(prop, val){
			return JOBAD.UserConfig.canSet(id, prop, val);
		},
		"getTypes": function(){
			return JOBAD.UserConfig.getTypes(id);
		},
		"reset": function(prop){
			return JOBAD.UserConfig.reset(id, prop);
		}
	};
};



JOBAD.modules.extensions.config = {
	"required": false, //not required
	
	"validate": function(prop){return true; }, 
	
	"init": function(available, value, originalObject, properObject){
		return JOBAD.modules.createProperUserSettingsObject(available ? value : {}, properObject.info.identifier);
	},
	"globalProperties": ["UserConfig", "Config"],
	"onRegister": function(value, properObject, moduleObject){
		var id = properObject.info.identifier;

		configSpec[id] = value; //store the specification in the cache; it is now open. 

		if(!configCache.hasOwnProperty()){
			JOBAD.UserConfig.reset(properObject.info.identifier);
		}
	},
	"onLoad": function(value, properObject, loadedModule){
		this.UserConfig = JOBAD.UserConfig.getFor(properObject.info.identifier);		
	}
}

/*
	Instance Based Configuration
*/

JOBAD.ifaces.push(function(JOBADRootElement, params){

	var config = params[1];
	
	var spec = JOBAD.modules.createProperUserSettingsObject({
		"cmenu_type": ["list", ['standard', 'radial'], 'standard', ["Context Menu Type", "Standard", "Radial"]],
		"sidebar_type": ["list", JOBAD.Sidebar.types, JOBAD.Sidebar.types[0], JOBAD.Sidebar.desc],
		"restricted_user_config": ["none", []]
	}, "");
	var cache = JOBAD.util.extend({}, (typeof config == 'undefined')?{}:config);

	this.Config = {};
	
	this.Config.get = function(key){
		if(!spec.hasOwnProperty(key)){
			JOBAD.console.log("Can't find '"+key+"' in Instance Config. ");
			return undefined;
		}
		if(cache.hasOwnProperty(key)){
			return cache[key];
		} else {
			return spec[key][2]; 
		}
		
	};
	
	this.Config.set = function(key, val){
		cache[key] = val;
	};
	
	this.Config.getTypes = function(){
		return spec;
	};
	
	this.Config.reset = function(){
		cache = {};
	};
	
	this.Config = JOBAD.util.bindEverything(this.Config, this);
});