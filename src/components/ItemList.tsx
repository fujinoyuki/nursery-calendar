import React from "react";
import { eventData, introduction } from "../lib/data";
import { Item } from "../models/Item";

const ItemList: React.FC = () => {
  const monthOrder = (month: number) => {
    if (month >= 4) return -month;
    return month;
  };
  const sortedEventData = [...eventData].sort(
    (a, b) => monthOrder(a.month) - monthOrder(b.month)
  );

    return (
    <div>
      <h2>アイテム一覧</h2>
      <p>{introduction}</p>
      <ul>
        {sortedEventData.map((item) => (
          <li key={item.id}>
           <h3>{item.title}</h3>
            <p>カテゴリ: {item.category}</p>
            <p>内容: {item.content}</p>
            <p>材料: {item.materials.join(", ")}</p>
            <p>対象年齢: {item.targetAge}</p>
            <p>月: {item.month}</p>
          </li>
        ))}
      </ul>
        <a href='/posts'>制作物を投稿する</a>
    </div>
  );
};

export default ItemList;