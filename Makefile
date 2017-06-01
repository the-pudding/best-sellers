server:
	browser-sync start --ss . --files . --index index.html --no-notify

live:
	aws s3 sync docs s3://pudding.cool/2017/06/best-sellers
	aws cloudfront create-invalidation --distribution-id E13X38CRR4E04D --paths '/2017/06/best-sellers*'  