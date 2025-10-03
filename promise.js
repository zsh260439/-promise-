function Promise(executor) {
    this.PromiseState = 'pending';
    this.PromiseResult = null;
    this.callbacks = [];
    const self = this; //指向自身 否则指向的是window
    //resolve 
    function resolve(data) {
        //判断状态
        if (self.PromiseState !== 'pending') return;
        //1：修改对象状态(promiseState)
        self.PromiseState = 'fulfilled';
        //2：修改对象结果值(promiseResult)
        self.PromiseResult = data;
        //调用成功的回调函数
        queueMicrotask(() => {
            self.callbacks.forEach((item) => {
                item.onResolved(data)
            })
        })
    }
    //reject
    function reject(data) {
        //判断状态
        if (self.PromiseState !== 'pending') return;
        //1：修改对象状态(promiseState)
        self.PromiseState = 'rejected';
        //2：修改对象结果值(promiseResult)
        self.PromiseResult = data;
        //调用失败回调函数
        queueMicrotask(() => {
            self.callbacks.forEach((item) => {
                item.onRejected(data)
            })
        })
    }
    try {
        executor(resolve, reject); //同步调用
    } catch (error) {
        //修改promise的状态为失败
        reject(error);
    }
}

Promise.prototype.then = function (onResolved, onRejected) {
    const self = this;
    //判断回调函数的参数 不然res和rej都会默认执行导致报错
    if (typeof onRejected !== 'function') {
        onRejected = reason => {
            throw reason; //抛出错误 直到最后catch处理
        }
    }
    if (typeof onResolved !== 'function') {
        onResolved = value => value; //没有指定参数 加入一个参数
    }

    return new Promise((resolve, reject) => { //此时存在返回值了
        function callback(type) { // 代码封装
            try {
                let res = type(self.PromiseResult);
                if (res instanceof Promise) {
                    //如果返回的res是promise对象
                    res.then((v) => {
                        resolve(v);
                    }, (e) => {
                        reject(e);
                    })
                } else {
                    resolve(res);
                }
            } catch (error) {
                reject(error);
            }
        }

        if (this.PromiseState === 'fulfilled') {
            queueMicrotask(() => {
                callback(onResolved);
            })

        }
        if (this.PromiseState === 'rejected') {
            queueMicrotask(() => {
                callback(onRejected);
            })

        }
        //判断pending状态
        if (this.PromiseState === 'pending') {
            //保存回调函数
            this.callbacks.push({
                onResolved: function () {
                    queueMicrotask(() => {
                        callback(onResolved);
                    })

                },
                onRejected: function () {
                    queueMicrotask(() => {
                        callback(onRejected);
                    })

                }
            })
        }
    })
}

//catch方法
Promise.prototype.catch = function (onRejected) { //接受失败的回调
    return this.then(undefined, onRejected);
}

//resolve 方法 分两层
Promise.resolve = function (value) {
    return new Promise((resolve, reject) => {
        if (value instanceof Promise) {
            value.then((v) => {
                resolve(v);
            }, (e) => {
                reject(e)
            })
        } else {
            //状态设置为成功
            resolve(value);
        }
    })
}

//reject 方法
Promise.reject = function (err) {
    return new Promise((resolve, reject) => {
        reject(err);
    })
}

Promise.all = function (promises) {
    return new Promise((resolve, reject) => {
        let cnt = 0;
        const res = [];
        for (let i = 0; i < promises.length; i++) {
            promises[i].then((val) => {
                cnt++;
                res[i] = val;
                if (cnt === promises.length) {
                    resolve(res);
                }
            }, (err) => {
                reject(err);
            });
        }
    })
}

Promise.race = function (promises) {
    return new Promise((resolve, reject) => {
        for (let i = 0; i < promises.length; i++) {
            promises[i].then((val) => {
                resolve(val);
            }, (err) => {
                reject(err);
            })
        }
    })
}