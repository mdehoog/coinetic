import {RBTree} from 'bintrees';

/**
 * Special Red-Black tree that keeps track of user-defined head size.
 *
 * When new elements are inserted or removed, the caller is notified if
 * the head of the tree has been modified.
 *
 * @extends RBTree
 */
export default class LimitedRBTree extends RBTree {
    /**
     * Create a new LimitedRBTree.
     *
     * @param limit {number} Head size
     * @param comparator {function} Comparator used for sorting elements
     */
    constructor(limit, comparator) {
        super(comparator || ((a, b) => a - b));
        this.limit = limit || limit === 0 ? limit : Infinity;
    }

    /**
     * @typedef {Object} LimitedRBTreeResult
     * @property {*} in - Element that was added
     * @property {*} out - Element that was removed
     */

    /**
     * Insert the given data element.
     *
     * @param data {*} Data to insert
     * @returns {LimitedRBTreeResult} Any elements that were added/removed from the head
     */
    insert(data) {
        return super.insert(data) && this.rank(data) < this.limit
            ? {in: data, out: this.size > this.limit ? this.get(this.limit) : null}
            : {in: null, out: null};
    }

    /**
     * Remove the given data element.
     *
     * @param data {*} Data to remove
     * @returns {LimitedRBTreeResult} Any elements that were added/removed from the head
     */
    remove(data) {
        const i = this.rank(data);
        return super.remove(data) && i < this.limit
            ? {in: this.size >= this.limit ? this.get(this.limit - 1) : null, out: data}
            : {in: null, out: null};
    }

    /**
     * Get the maximum data element within the limit.
     *
     * @returns {*} Data at the end of the head
     */
    limitedMax() {
        return this.size < this.limit ? this.max() : this.get(this.limit - 1);
    }
}