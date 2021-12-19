/*! Pts.js is licensed under Apache License 2.0. Copyright © 2017-current William Ngan and contributors. (https://github.com/williamngan/pts) */
import { IPt, GroupLike, PtLike, PtIterable, PtLikeIterable } from "./Types";
export declare class Pt extends Float32Array implements IPt, Iterable<number> {
    protected _id: string;
    constructor(...args: any[]);
    static make(dimensions: number, defaultValue?: number, randomize?: boolean): Pt;
    get id(): string;
    set id(s: string);
    get x(): number;
    set x(n: number);
    get y(): number;
    set y(n: number);
    get z(): number;
    set z(n: number);
    get w(): number;
    set w(n: number);
    clone(): Pt;
    equals(p: PtLike, threshold?: number): boolean;
    to(...args: any[]): this;
    $to(...args: any[]): Pt;
    toAngle(radian: number, magnitude?: number, anchorFromPt?: boolean): this;
    op(fn: (p1: PtLike, ...rest: any[]) => any): (...rest: any[]) => any;
    ops(fns: ((p1: PtLike, ...rest: any[]) => any)[]): ((...rest: any[]) => any)[];
    $take(axis: string | number[]): Pt;
    $concat(...args: any[]): Pt;
    add(...args: any[]): this;
    $add(...args: any[]): Pt;
    subtract(...args: any[]): this;
    $subtract(...args: any[]): Pt;
    multiply(...args: any[]): this;
    $multiply(...args: any[]): Pt;
    divide(...args: any[]): this;
    $divide(...args: any[]): Pt;
    magnitudeSq(): number;
    magnitude(): number;
    unit(magnitude?: number): Pt;
    $unit(magnitude?: number): Pt;
    dot(...args: any[]): number;
    $cross2D(...args: any[]): number;
    $cross(...args: any[]): Pt;
    $project(...args: any[]): Pt;
    projectScalar(...args: any[]): number;
    abs(): Pt;
    $abs(): Pt;
    floor(): Pt;
    $floor(): Pt;
    ceil(): Pt;
    $ceil(): Pt;
    round(): Pt;
    $round(): Pt;
    minValue(): {
        value: number;
        index: number;
    };
    maxValue(): {
        value: number;
        index: number;
    };
    $min(...args: any[]): Pt;
    $max(...args: any[]): Pt;
    angle(axis?: string | number[]): number;
    angleBetween(p: Pt, axis?: string | number[]): number;
    scale(scale: number | number[] | PtLike, anchor?: PtLike): this;
    rotate2D(angle: number, anchor?: PtLike, axis?: string): this;
    shear2D(scale: number | number[] | PtLike, anchor?: PtLike, axis?: string): this;
    reflect2D(line: GroupLike, axis?: string): this;
    toString(): string;
    toArray(): number[];
    toGroup(): Group;
    toBound(): Bound;
}
export declare class Group extends Array<Pt> {
    protected _id: string;
    constructor(...args: Pt[]);
    get id(): string;
    set id(s: string);
    get p1(): Pt;
    get p2(): Pt;
    get p3(): Pt;
    get p4(): Pt;
    get q1(): Pt;
    get q2(): Pt;
    get q3(): Pt;
    get q4(): Pt;
    clone(): Group;
    static fromArray(list: PtLikeIterable): Group;
    static fromPtArray(list: PtIterable): Group;
    split(chunkSize: number, stride?: number, loopBack?: boolean): Group[];
    insert(pts: PtIterable, index?: number): this;
    remove(index?: number, count?: number): Group;
    segments(pts_per_segment?: number, stride?: number, loopBack?: boolean): Group[];
    lines(): Group[];
    centroid(): Pt;
    boundingBox(): Group;
    anchorTo(ptOrIndex?: PtLike | number): void;
    anchorFrom(ptOrIndex?: PtLike | number): void;
    op(fn: (g1: PtIterable, ...rest: any[]) => any): (...rest: any[]) => any;
    ops(fns: ((g1: PtIterable, ...rest: any[]) => any)[]): ((...rest: any[]) => any)[];
    interpolate(t: number): Pt;
    moveBy(...args: any[]): this;
    moveTo(...args: any[]): this;
    scale(scale: number | number[] | PtLike, anchor?: PtLike): this;
    rotate2D(angle: number, anchor?: PtLike, axis?: string): this;
    shear2D(scale: number | number[] | PtLike, anchor?: PtLike, axis?: string): this;
    reflect2D(line: PtLikeIterable, axis?: string): this;
    sortByDimension(dim: number, desc?: boolean): this;
    forEachPt(ptFn: string, ...args: any[]): this;
    add(...args: any[]): this;
    subtract(...args: any[]): this;
    multiply(...args: any[]): this;
    divide(...args: any[]): this;
    $matrixAdd(g: GroupLike | number[][] | number): Group;
    $matrixMultiply(g: GroupLike | number, transposed?: boolean, elementwise?: boolean): Group;
    zipSlice(index: number, defaultValue?: number | boolean): Pt;
    $zip(defaultValue?: number | boolean, useLongest?: boolean): Group;
    toString(): string;
}
export declare class Bound extends Group implements IPt {
    protected _center: Pt;
    protected _size: Pt;
    protected _topLeft: Pt;
    protected _bottomRight: Pt;
    protected _inited: boolean;
    constructor(...args: Pt[]);
    static fromBoundingRect(rect: ClientRect): Bound;
    static fromGroup(g: PtLikeIterable): Bound;
    protected init(): void;
    clone(): Bound;
    protected _updateSize(): void;
    protected _updateCenter(): void;
    protected _updatePosFromTop(): void;
    protected _updatePosFromBottom(): void;
    protected _updatePosFromCenter(): void;
    get size(): Pt;
    set size(p: Pt);
    get center(): Pt;
    set center(p: Pt);
    get topLeft(): Pt;
    set topLeft(p: Pt);
    get bottomRight(): Pt;
    set bottomRight(p: Pt);
    get width(): number;
    set width(w: number);
    get height(): number;
    set height(h: number);
    get depth(): number;
    set depth(d: number);
    get x(): number;
    get y(): number;
    get z(): number;
    get inited(): boolean;
    update(): this;
}
