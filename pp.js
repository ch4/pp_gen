var phantomfs = require('fs');
var casper = require('casper').create();
var config = require('./config.js');
var ccArr = [];
var userData = '';
var user = {
        email : '',
        password : '',
        firstname : '',
        lastname : '',
        street : '',
        city : 'San Francisco',
        state : 'CA',
        zip : '94112',
        phone : '',
        cc: '',
        exp: '',
        cvv: ''
}
var randomUserUrl = 'https://randomuser.me/api/?nat=us';

casper.start(config.target_url, function() {
    this.viewport(1920, 1080);
    this.userAgent(config.useragent);
    userData = this.evaluate(function(wsurl) {
        return JSON.parse(__utils__.sendAJAX(wsurl, 'GET', null, false));
    }, {wsurl: randomUserUrl});

    var array = phantomfs.read(config.target_file).split("\n");
    for(i in array) {
//        console.log(array[i]);
        var line = array[i].trim();
        if(line.length > 0){
            ccArr.push(line.split(','));
        }
    }
//    console.log(JSON.stringify(ccArr));

    var content = '';
    var idx = undefined;
    for(i in ccArr) {
        for(j in ccArr[i]) {
            if(j > 0) content = content + ',';
            content = content + ccArr[i][j];
        }

        if(ccArr[i][3] != 'true' && idx === undefined) {
//            console.log('found unused line at ' + i);
            idx = i;
            content = content + ',true';
        }

        if(ccArr[i] != undefined){
            content = content + '\n';
        }
    }

    phantomfs.write(config.target_file, content, 'w');
    
    if(idx === undefined){
        console.log('no valid lines found');
    } else {
        user.cc = ccArr[i][0];
        user.exp = ccArr[i][2];
        user.cvv = ccArr[i][1];
    }
});

casper.then(function(){
    user.email = userData.results[0].user.username + config.email_domain;
    user.password = config.password;
    user.firstname = userData.results[0].user.name.first;
    user.lastname = userData.results[0].user.name.last;
    user.street = userData.results[0].user.location.street;
    //user.phone = (userData.results[0].user.phone.replace(/\D/g,''));
    user.phone = userData.results[0].user.phone.replace('-',' ');

    //test
//    console.log(JSON.stringify(user));
});

casper.then(function() {
    this.capture('1.png');

    this.wait(1989, function then(){
        this.fillSelectors('form.proceed', {
                'input[name="email"]':    user.email,
                'input[name="password"]':    user.password,
                'input[name="confirmPassword"]':   user.password
            }, true);
    });
});

casper.then(function(){
    this.wait(1989, function then(){
        this.capture('2.png');
        this.fillSelectors('form.proceed', {
                'input[name="firstName"]':    user.firstname,
                'input[name="lastName"]':    user.lastname,
                'input[name="address1"]':   user.street,
                'input[name="city"]':   user.city,
                'select[name="state"]':   user.state,
                'input[name="zip"]':   user.zip,
                'input[name="phoneNumber"]':   user.phone,
                'input[name="terms"]':   true, //"checked"?
            }, true);
    });
});

casper.then(function(){
    this.wait(1989, function then(){
        this.capture('3.png');
        this.fillSelectors('form.proceed', {
                'input[name="cardNumber"]':    user.cc,
                'input[name="expiryDate"]':    user.exp,
                'input[name="csc"]':    user.cvv,
                'input[name="address1"]':   user.street,
                'input[name="city"]':   user.city,
                'select[name="state"]':   user.state,
                'input[name="zip"]':   user.zip,
            }, true);
    });
});
casper.then(function(){
    console.log(user.email);
    this.wait(1989, function then(){
        this.capture('4.png');
    });
});

casper.run();