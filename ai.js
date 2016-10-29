
Ai = function(id){
    
    var WebSocket = require('websocket').client;

    this.request = require('request');
    this.options = {
	url: 'http://localhost:3000/ais/'+id,
	method: 'GET',
	json: true
    }

    var _this = this;

    // id を引数から読み込む
    // e.g. node command 3 (id == 3)
    this.id = id;

    this.client = new WebSocket();

    this.client.on('connectFailed', function(err){
	console.log(' * 接続失敗 * ');
    });

    // 接続処理
    this.client.on('connect', function(conn){

	console.log('WebSocket接続成功!');
	
	_this.conn = conn;

	conn.on('message', function(_msg){

	    data = JSON.parse(_msg.utf8Data);
	    msg  = data['message'];

	    if('auth' in Object(msg)){
		// 認証系

		console.log('認証情報');

		if(msg['auth']){
		    console.log(' -> 認証成功');
		}else{
		    console.log(' -> 認証失敗');
		}
	    }else if('match' in Object(msg)){
		// マッチ

		console.log('マッチ情報');

		if(msg['match']){

		    date = new Date();

		    console.log(' -> マッチ相手が見つかりました！');
		    console.log(' -> ステージ: '+msg['stage']);

		    _this.gaming = true;

		    _this.stage = msg['stage'];
		    _this.stepCount = 0;
		    _this.step();

		}else{
		    console.log(' -> マッチ相手が見つかりませんでした');
		}
	    }else if('step' in Object(msg)){
		// ステップ
		console.log('相手 ('+msg['step_count']+') -> '+msg['step']);
	    }else if('fin' in Object(msg)){
		// ゲーム終了
		_this.gaming = false;

		console.log('ゲーム終了！');
		if(msg['fin']){
		    console.log('勝利！');
		}else{
		    console.log('敗北...');
		}
	    }
	});

	// 購読
	_this.conn.sendUTF(_this._subscribe());

	// マッチング要求
	setTimeout(function(){
	    console.log('マッチ待機中...');
	    _this.conn.sendUTF(_this._match());
	}, 500);
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
    data['id'] = this.id;
    data['token'] = 'aaa';

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
    
    if(this.stage.length == this.stepCount || !this.gaming){
	console.log('Finish!');
	return;
    }

    interval_range = this.max_interval - this.min_interval; 
    
    // ステップのインターバル
    interval = Math.random() * interval_range + this.min_interval;

    console.log('自分 ('+this.stepCount+') -> '+this.stage[this.stepCount]);

    if(this.correct_rate > Math.random()){
	// 正しいステップを送信
	this.conn.sendUTF(this._step(this.stage[this.stepCount]));
    }else{
	//間違ったステップを送信
	console.log('失敗ステップ！');
	this.conn.sendUTF(this._step(
	    (this.stage[this.stepCount]+1)%4
	));
    }
    
    // 一歩すすめる
    this.stepCount ++;
    
    setTimeout(function(){
	_this.step();
    }, interval * 1000);
}

Ai.prototype.run = function(){

    var _this = this;

    //AIのステータス取得
    this.request(this.options, function(error, response, body){

	_this.min_interval = body['min_interval'];
	_this.max_interval = body['max_interval'];
	_this.correct_rate = body['correct_rate'];

	console.log('Min interval: '+_this.min_interval);
	console.log('Max interval: '+_this.max_interval);
	console.log('Correct rate: '+_this.correct_rate);

	_this.client.connect('ws://localhost:3000/cable');
    })
}

module.exports = Ai;
