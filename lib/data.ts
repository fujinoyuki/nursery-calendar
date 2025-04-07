export const getPosts = () => {
  return [
    { id: '1', title: '３月のイベントアイデア' },
    { id: '2', title: '４月のイベントアイデア' },
  ];
};

interface Post {
  id: string;
  title: string;
}