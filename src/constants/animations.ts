/**
 * LOADING: Trang đang trong quá trình tải
 * ENTERING: Trang đang trong quá trình chuyển vào
 * ENTERED: Trang đã được chuyển vào hoàn tất
 * EXITING: Trang đang trong quá trình chuyển ra
 * EXITED: Trang đã được chuyển ra hoàn tất
 */
export enum PageStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  ENTERING = 'entering',
  ENTERED = 'entered',
  EXITING = 'exiting',
  EXITED = 'exited'
}
