
Ai = function(_data){

    var data = JSON.parse(_data);
    
    var WebSocket = require('websocket').client;

    this.min_interval = data['min_interval'];
    this.max_interval = data['max_interval'];
    this.correct_rate = data['correct_rate'];
    this.user = data['user'];

    var _this = this;

    this.client = new WebSocket();

    this.client.on('connectFailed', function(err){
	console.log('接続失敗...');
    });

    // 接続処理
    this.client.on('connect', function(conn){

	console.log('WebSocket接続成功!');
	
	_this.conn = conn;

	conn.on('message', function(_msg){

	    data = JSON.parse(_msg.utf8Data);
	    msg  = data['message'];

	    if(!('type' in Object(msg))){
		return;
	    }

	    type = msg['type'];

	    if(type == 'auth'){
		// 認証系

		console.log('認証情報');

		if(msg['auth']){
		    console.log(' -> 認証成功');
		}else{
		    console.log(' -> 認証失敗');
		}
	    }else if(type == 'match'){
		// マッチ

		console.log('マッチ情報');

		console.log(' -> マッチ相手が見つかりました！');
		console.log(' -> ステージ: '+msg['stage']);

		console.log(' -> 相手の情報');
		console.log('    名前: '+msg['matched']['name']);
		console.log('    レート: '+msg['matched']['rate']);

		_this.gaming = true;

		_this.stage = msg['stage'];
		_this.stepCount = 0;
		//3.1秒後にステップ開始
		setTimeout(function(){
		    _this.step();
		}, 3100);
		
	    }else if(type == 'step'){
		// ステップ
		console.log('相手 ('+msg['step_count']+') -> '+msg['step']);
	    }else if(type == 'fin'){
		// ゲーム終了
		_this.gaming = false;

		console.log('ゲーム終了！');

		if(msg['fin']){
		    console.log('勝利！');
		}else{
		    console.log('敗北...');
		}

		console.log('レートが'+msg['user']['rate']+'になった');
	    }
	});

	setTimeout(function(){

	    // 購読
	    _this.conn.sendUTF(_this._subscribe());

	    // マッチング要求
	    setTimeout(function(){
		console.log('マッチ待機中...');
		_this.conn.sendUTF(_this._match());
	    }, 300);
	}, 300);
    });

}

Ai.prototype._channel = function(){
    channel = {};
    channel['channel'] = 'MatchChannel';
    return JSON.stringify(channel);
}

Ai.prototype._subscribe = function(){
    command = {};
    command['command'] = 'subscribe';
    command['identifier'] = this._channel();
    return JSON.stringify(command);
}

Ai.prototype._match = function(){

    data = {};
    data['action'] = 'match';
    data['id'] = this.user['id'];
    data['token'] = this.user['token'];

    command = {};
    command['command'] = 'message';
    command['identifier'] = this._channel();
    command['data'] = JSON.stringify(data);
    return JSON.stringify(command);
}

Ai.prototype._step = function(i){

    data = {}
    data['action'] = 'step';
    data['step'] = i;

    command = {}
    command['command'] = 'message';
    command['identifier'] = this._channel();
    command['data'] = JSON.stringify(data);
    return JSON.stringify(command);
}

Ai.prototype.step = function(){

    var _this = this;

    interval_range = _this.max_interval - _this.min_interval; 
    
    // ステップのインターバル
    interval = Math.random() * interval_range + _this.min_interval;
    
    setTimeout(function(){

	if(_this.stage.length == _this.stepCount || !_this.gaming){
	    console.log('Finish!');
	    // process.exit();
	    return;
	}

	console.log('自分 ('+_this.stepCount+') -> '+_this.stage[_this.stepCount]);

	if(_this.correct_rate > Math.random()){
	    // 正しいステップを送信
	    _this.conn.sendUTF(_this._step(_this.stage[_this.stepCount]));
	}else{
	    //間違ったステップを送信
	    console.log('失敗ステップ！');
	    _this.conn.sendUTF(_this._step(
		(_this.stage[_this.stepCount]+1)%4
	    ));
	}
	
	// 一歩すすめる
	_this.stepCount ++;

	_this.step();

    }, interval * 1000);
}

Ai.prototype.run = function(){
    this.client.connect('ws://localhost:3000/cable');
}

module.exports = Ai;
