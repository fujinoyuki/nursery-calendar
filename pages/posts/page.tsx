import { read_file, natural_language_write_file } from "./temp/tools";

const PostPage = () => {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = (event.currentTarget.elements.namedItem('title') as HTMLInputElement)?.value;
    const category = (event.currentTarget.elements.namedItem('category') as HTMLSelectElement)?.value;
    const content = (event.currentTarget.elements.namedItem('content') as HTMLTextAreaElement)?.value;
    const materials = (event.currentTarget.elements.namedItem('materials') as HTMLInputElement)?.value;
        const targetAge = (event.currentTarget.elements.namedItem('targetAge') as HTMLInputElement)?.value;
    const howToMake = (event.currentTarget.elements.namedItem('howToMake') as HTMLTextAreaElement)?.value;
    const monthElements = event.currentTarget.elements.namedItem('month') as HTMLInputElement[] | null;
    const month: string[] = [];
    if(monthElements){
      for (let i = 0; i < monthElements.length; i++) {
        if (monthElements[i].checked) {
          month.push(monthElements[i].value);
        }
      }
    }
    const data = {
      title: title,
      category: category,
      content: content,
      materials: materials,
      targetAge: targetAge,
      howToMake: howToMake,
      month: month,
    };
    let existingData: any[] = [];
    try {
      const fileData = await read_file({ path: "temp.json" });
           existingData = JSON.parse(fileData.result);
    } catch (error) {
      console.error("Error reading /home/user/nursery-calendar/temp.json:", error);
      existingData = [];
    }
    const newData = [...existingData, data];
    console.log(newData);
    const currentFileData = await read_file({ path: "/home/user/nursery-calendar/temp.json" });
       console.log("temp.json before save:", currentFileData.result);
    try {
      await natural_language_write_file({
       path: "temp.json",
        prompt: `${JSON.stringify(newData)}`,
      });
        console.log("Data saved to temp.json");
      } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  return (
    <div>
      <h1 id="form-title">投稿ページ</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">タイトル:</label>
          <input type="text" id="title" name="title" />
        </div>
        <div>
          <label htmlFor="category">カテゴリ:</label>
          <select id="category" name="category">
            <option value="壁面">壁面</option>
            <option value="子供用制作物">子供用制作物</option>
            <option value="イベント用">イベント用</option>
            <option value="その他">その他</option>
          </select>
        </div>
        <div>
          <label htmlFor="content">内容:</label>
          <textarea id="content" name="content" />
        </div>
        <div>
          <label htmlFor="materials">必要な材料:</label>
          <input type="text" id="materials" name="materials" />
        </div>
        <div>
          <label htmlFor="targetAge">対象年齢:</label>
          <input type="text" id="targetAge" name="targetAge" />
        </div>
        <div>
          <label htmlFor="howToMake">作り方:</label>
          <textarea id="howToMake" name="howToMake" />
        </div>
        <div>
          <label>月:</label>
          <div>
            {[...Array(12)].map((_, i) => {
              const month = i + 1;
              return (
                <div key={month}>
                  <input
                    type="checkbox"
                    id={`month-${month}`}
                    name="month"
                    value={month}
                  />
                  <label htmlFor={`month-${month}`}>{month}月</label>
                </div>
              );
            })}
          </div>
        </div>
        <button type="submit">投稿</button>
      </form>
    </div>
  );
};

export default PostPage;
