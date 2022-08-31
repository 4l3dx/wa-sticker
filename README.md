
You need to have ffmpeg installed on your system.
## Installation


```bash 
npm install wa-sticker
```


## Usage

```typescript
import { createSticker } from 'wa-sticker'

(async () => {

  const sticker = await createSticker(['./temp/test.jpg'], {
    crop: true,
    metadata: {
      publisher: 'Whatsapp',
      packname: 'MySticker'
    }
  })
  await sock.sendMessage(chatId, { sticker })

})()
```
## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)


