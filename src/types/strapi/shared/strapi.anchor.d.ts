type StrapiAnchor = StrapiBaseModel & {
  title: string;
  link: string;
  target: 'Open in new tab' | 'Open in the same frame';
};

type StrapiAnchorWithVimeo = StrapiBaseModel & {
  title: string;
  link: string;
  target: 'Open in the same frame';
  vimeoLink: string;
};
