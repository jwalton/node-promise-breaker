
import pb from '..';

const make0 = pb.make((cb: (err?: Error, result?: string) => void) =>
    cb(undefined, 'hello')
);
make0().then(result => console.log(result));

const make1 = pb.make((a: string, cb: (err?: Error, result?: string) => void) =>
    cb(undefined, 'hello')
);
make1('a').then(result => console.log(result));


const make2 = pb.make((a: string, b: number, cb: (err?: Error, result?: string) => void) =>
    cb(undefined, 'hello' + a)
);
make2('jason', 2).then(result => console.log(result));

const make3 = pb.make((a: string, b: number, c: string, cb: (err?: Error, result?: string) => void) =>
    cb(undefined, 'hello' + a)
);
make3('jason', 2, 'foo').then(result => console.log(result));

const make4 = pb.make((a: string, b: number, c: string, d: number, cb: (err?: Error, result?: string) => void) =>
    cb(undefined, 'hello' + a)
);
make4('jason', 2, 'foo', 10).then(result => console.log(result));
